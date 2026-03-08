import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { resolveAssetUrl, trpcClient } from './api/trpcClient';

const buildActionLabels = (speaker, scene) => {
  const name = speaker?.name?.split(' ')[0] || 'them';
  const settingLead = scene?.description
    ?.split(/[,.]/)[0]
    ?.trim()
    ?.replace(/^./, (value) => value.toLowerCase()) || 'the moment';

  return [
    `Ask ${name} what this means`,
    `Read ${settingLead}`,
    'Choose the dangerous option',
  ];
};

const trimCopy = (value, fallback) => {
  if (!value) {
    return fallback;
  }

  return value.length > 180 ? `${value.slice(0, 177)}...` : value;
};

const fileToPreviewUrl = (file) => (file ? URL.createObjectURL(file) : '');

function App() {
  const queryClient = useQueryClient();
  const cameraInputRef = useRef(null);
  const uploadInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [storyId, setStoryId] = useState(null);
  const [activeAction, setActiveAction] = useState('');
  const [warnings, setWarnings] = useState([]);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl('');
      return undefined;
    }

    const nextPreviewUrl = fileToPreviewUrl(selectedFile);
    setPreviewUrl(nextPreviewUrl);

    return () => {
      URL.revokeObjectURL(nextPreviewUrl);
    };
  }, [selectedFile]);

  const storyQuery = useQuery({
    queryKey: ['story', storyId],
    queryFn: () => trpcClient.story.byId.query({ storyId }),
    enabled: Boolean(storyId),
    gcTime: 10 * 60 * 1000,
  });

  const generateStoryMutation = useMutation({
    mutationFn: async (imageFile) => {
      const formData = new FormData();
      formData.append('image', imageFile);

      return trpcClient.story.generate.mutate(formData);
    },
    onMutate: () => {
      setStoryId(null);
      setActiveAction('');
      setWarnings([]);
    },
    onSuccess: (result) => {
      queryClient.setQueryData(['story', result.story.id], result);
      setStoryId(result.story.id);
      setWarnings(result.warnings);
    },
  });

  const doTurnMutation = useMutation({
    mutationFn: ({ storyId: nextStoryId, turnText }) =>
      trpcClient.story.doTurn.mutate({
        storyId: nextStoryId,
        turnText,
      }),
    onSuccess: (result) => {
      queryClient.setQueryData(['story', result.story.id], result);
    },
  });

  const currentStoryResponse =
    storyQuery.data ||
    (storyId ? queryClient.getQueryData(['story', storyId]) : null);
  const currentStory = currentStoryResponse?.story || null;
  const currentTurn = currentStory?.current_turn || currentStory?.turns?.at(-1) || null;
  const currentScene =
    currentStory?.current_scene || currentStory?.scenes?.[0] || null;
  const speaker =
    currentStory?.characters?.find(
      (character) =>
        Number(character.id) === Number(currentTurn?.speaker_character_id),
    ) ||
    currentStory?.characters?.[0] ||
    null;
  const actionLabels = buildActionLabels(speaker, currentScene);
  const sceneBackgroundUrl = resolveAssetUrl(currentScene?.background_image_url);
  const characterImageUrl = resolveAssetUrl(speaker?.image_url);
  const sourceImageUrl = resolveAssetUrl(currentStory?.source_image_url);
  const isLoadingStory =
    generateStoryMutation.isPending ||
    (storyQuery.isLoading && !currentStory) ||
    (storyQuery.isFetching && !currentStory);

  const resetExperience = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setStoryId(null);
    setActiveAction('');
    setWarnings([]);
    generateStoryMutation.reset();
    doTurnMutation.reset();
  };

  const handleFileSelect = (event) => {
    const nextFile = event.target.files?.[0];

    if (!nextFile) {
      return;
    }

    setSelectedFile(nextFile);
    setStoryId(null);
    setActiveAction('');
    setWarnings([]);
    generateStoryMutation.reset();
    doTurnMutation.reset();
    event.target.value = '';
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!selectedFile || generateStoryMutation.isPending) {
      return;
    }

    generateStoryMutation.mutate(selectedFile);
  };

  const handleActionPress = (label) => {
    setActiveAction(label);
    doTurnMutation.mutate({
      storyId: currentStory.id,
      turnText: label,
    });
  };

  return (
    <main className="min-h-svh bg-[radial-gradient(circle_at_top,_rgba(255,190,118,0.24),_transparent_28%),linear-gradient(180deg,_#120f1b_0%,_#1b2236_48%,_#05070d_100%)] text-white">
      {currentStory ? (
        <section className="relative isolate flex min-h-svh flex-col overflow-hidden">
          <div className="absolute inset-0">
            {sceneBackgroundUrl ? (
              <img
                src={sceneBackgroundUrl}
                alt={currentScene?.description || 'Story background'}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(255,170,102,0.3),_transparent_34%),linear-gradient(180deg,_rgba(38,47,73,0.94)_0%,_rgba(8,10,18,0.96)_100%)]" />
            )}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(7,10,18,0.2)_0%,_rgba(7,10,18,0.66)_35%,_rgba(7,10,18,0.94)_100%)]" />
          </div>

          <div className="relative z-10 flex min-h-svh flex-col px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div className="max-w-xs rounded-3xl border border-white/12 bg-black/20 px-4 py-3 backdrop-blur-md">
                <p className="text-[0.65rem] uppercase tracking-[0.32em] text-amber-200/80">
                  Episode One
                </p>
                <h1 className="mt-2 font-display text-3xl leading-none text-white">
                  {speaker?.name || 'Your Story'}
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-200/88">
                  {trimCopy(
                    currentStory.story_background,
                    'A cinematic opening scene generated from your photo.',
                  )}
                </p>
                {warnings.length ? (
                  <div className="mt-3 rounded-2xl border border-amber-200/20 bg-amber-200/10 px-3 py-2 text-xs leading-5 text-amber-50/88">
                    {warnings.map((warning) => warning.message).join(' ')}
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                onClick={resetExperience}
                className="rounded-full border border-white/15 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-md transition hover:bg-white/16"
              >
                New Photo
              </button>
            </div>

            <div className="mt-auto flex flex-col items-start gap-4">
              <div className="flex w-full flex-wrap items-end gap-3 sm:gap-4">
                <div className="relative w-[8.5rem] overflow-hidden rounded-[1.4rem] border border-white/16 bg-[linear-gradient(180deg,_rgba(255,208,151,0.24)_0%,_rgba(72,98,148,0.16)_100%)] shadow-[0_18px_48px_rgba(0,0,0,0.3)] sm:w-[10rem]">
                  {characterImageUrl ? (
                    <img
                      src={characterImageUrl}
                      alt={speaker?.name || 'Character portrait'}
                      className="h-52 w-full object-cover object-top sm:h-60"
                    />
                  ) : sourceImageUrl ? (
                    <img
                      src={sourceImageUrl}
                      alt="Uploaded inspiration"
                      className="h-52 w-full object-cover object-center sm:h-60"
                    />
                  ) : (
                    <div className="flex h-52 items-end justify-start bg-[radial-gradient(circle_at_top,_rgba(255,196,135,0.48),_transparent_50%),linear-gradient(180deg,_rgba(255,255,255,0.12)_0%,_rgba(255,255,255,0.02)_100%)] p-3 sm:h-60">
                      <div className="rounded-full border border-white/20 bg-black/20 px-3 py-1 text-[0.65rem] uppercase tracking-[0.24em] text-white/82">
                        Render Pending
                      </div>
                    </div>
                  )}
                </div>

                <div className="w-full max-w-[26rem] rounded-[1.4rem] border border-white/14 bg-black/25 px-4 py-4 text-white shadow-[0_20px_56px_rgba(0,0,0,0.28)] backdrop-blur-lg sm:px-5">
                  <div>
                    <p className="text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-amber-100/70">
                      Current Turn
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-[#ff8f57]" />
                      <h2 className="font-display text-[1.75rem] leading-none text-white">
                        {speaker?.name || 'Narrator'}
                      </h2>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-100/90 sm:text-[0.95rem]">
                      {currentTurn?.text ||
                        'The opening beat is ready, but this turn did not include dialogue.'}
                    </p>
                  </div>

                </div>
              </div>

              <div className="w-full max-w-2xl rounded-[2rem] border border-white/12 bg-black/25 p-3 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl">
                <div className="space-y-3">
                  <p className="px-1 text-[0.72rem] font-semibold uppercase tracking-[0.32em] text-amber-100/70">
                    Choose Your Move
                  </p>
                  <div className="grid gap-2">
                    {actionLabels.map((label) => {
                      const isActive = label === activeAction;

                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => handleActionPress(label)}
                          disabled={doTurnMutation.isPending}
                          className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                            isActive
                              ? 'border-amber-300/70 bg-amber-300/20 text-white shadow-[0_12px_32px_rgba(246,173,85,0.22)]'
                              : 'border-white/12 bg-white/8 text-white/92 hover:bg-white/14'
                          } disabled:cursor-wait disabled:opacity-60`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="min-h-10 px-1 text-sm leading-6 text-slate-200/78">
                    {doTurnMutation.isPending
                      ? 'Writing the next turn from your choice...'
                      : activeAction
                        ? `Last choice: ${activeAction}`
                        : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="relative isolate flex min-h-svh items-center px-4 py-6 sm:px-6">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute left-1/2 top-[-4rem] h-56 w-56 -translate-x-1/2 rounded-full bg-amber-300/26 blur-3xl" />
            <div className="absolute bottom-12 right-[-3rem] h-48 w-48 rounded-full bg-sky-300/18 blur-3xl" />
          </div>

          <form
            onSubmit={handleSubmit}
            className="relative z-10 mx-auto flex w-full max-w-md flex-col gap-4"
          >
              <h1 className="mt-3 font-display text-5xl leading-none text-white">
                Storynow
              </h1>
              <p className="text-sm text-white/80">Turn any photo into a story game.</p>


            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileSelect}
            />
            <input
              ref={uploadInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="rounded-[1.4rem] border border-white/14 bg-white/10 px-4 py-4 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/16"
              >
                Take Photo
              </button>
              <button
                type="button"
                onClick={() => uploadInputRef.current?.click()}
                className="rounded-[1.4rem] border border-white/14 bg-black/22 px-4 py-4 text-sm font-semibold text-white transition hover:bg-black/30"
              >
                Upload Image
              </button>
            </div>

            <button
              type="submit"
              disabled={!selectedFile || generateStoryMutation.isPending}
              className="rounded-[1.6rem] bg-[linear-gradient(135deg,_#ffb26f_0%,_#ff805d_48%,_#ee5d6c_100%)] px-5 py-4 text-base font-semibold text-slate-950 shadow-[0_20px_50px_rgba(238,93,108,0.35)] transition enabled:hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {generateStoryMutation.isPending
                ? 'Generating opening scene...'
                : 'Generate Story'}
            </button>

          </form>

          {isLoadingStory ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#05070d]/78 px-6 backdrop-blur-lg">
              <div className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-black/42 p-6 text-white shadow-[0_32px_100px_rgba(0,0,0,0.42)]">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.32em] text-amber-200/82">
                  Building Your Episode
                </p>
                <h2 className="mt-3 font-display text-4xl leading-none">
                  Developing the first scene.
                </h2>
                <p className="mt-4 text-sm leading-7 text-slate-200/78">
                  Waiting for the backend to finish story generation, character
                  art, and scene media.
                </p>

                <div className="mt-6 flex items-end gap-2">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="h-10 w-3 rounded-full bg-[linear-gradient(180deg,_#ffd9a1_0%,_#ff8b5d_100%)] animate-pulse"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>

                {previewUrl ? (
                  <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-white/10">
                    <img
                      src={previewUrl}
                      alt="Selected upload preview"
                      className="h-40 w-full object-cover"
                    />
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </section>
      )}
    </main>
  );
}

export default App;
