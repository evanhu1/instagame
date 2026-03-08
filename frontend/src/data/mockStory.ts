import type { Story } from '@/types/game';

export const MOCK_STORY: Story = {
  title: "Shadows at the Summit",
  genre: "thriller",
  premise: "You are an investigative journalist attending a tech conference. Your source — a whistleblower inside Nexus Corp — was supposed to meet you tonight. They never showed. Now their seat is empty, and their badge is on the floor.",
  playerRole: "Investigative journalist, undercover at a tech summit",

  characters: [
    {
      id: "maya",
      name: "Maya Torres",
      role: "The Organizer",
      personality: "Polished, helpful on the surface, but deflects hard questions",
      color: "#d4a843", // amber accent for her dialogue
    },
    {
      id: "chen",
      name: "Director Chen",
      role: "The Executive",
      personality: "Cold, calculating, speaks in short sentences, always watching",
      color: "#5b8fb9", // cool blue accent
    },
  ],

  scenes: [
    {
      id: "scene_1",
      narration: "The keynote just ended. The crowd files out of the main hall, buzzing about Nexus Corp's announcement. You linger near the back row, staring at the empty seat — Row 14, Seat 7. A badge lies on the floor beneath it.",
      musicMood: "tense_ambient",
      beats: [
        {
          speaker: "narrator",
          text: "You pick up the badge. The name reads: 'Alex Reeves — Independent Consultant.' Your source's cover identity.",
        },
        {
          speaker: "maya",
          text: "Hey — you dropped that, right? I saw you sitting near there during the keynote.",
          enterFrom: "right",
        },
        {
          speaker: null,
          text: null,
          choices: [
            { id: "c1a", text: "Yes, it's mine. Thanks for noticing.", tone: "evasive", icon: "👀" },
            { id: "c1b", text: "No. Someone left in a hurry. Do you know who was sitting here?", tone: "curious", icon: "🔍" },
            { id: "c1c", text: "Who are you, and why are you paying attention to where I sit?", tone: "aggressive", icon: "⚔️" },
          ],
        },
        {
          speaker: "maya",
          text: "I'm Maya Torres — I organized this event. I know every seat in this room. That one belonged to someone who checked in but... never actually sat down.",
          afterChoice: "c1b",
        },
        {
          speaker: "maya",
          text: "Whoa, easy. I'm the event organizer. It's literally my job to notice things. I'm Maya.",
          afterChoice: "c1c",
        },
        {
          speaker: "maya",
          text: "Oh — of course! Enjoy the rest of the summit. The networking reception is on the rooftop in ten minutes.",
          afterChoice: "c1a",
        },
        {
          speaker: "narrator",
          text: "Maya smiles, but her eyes flick to the badge in your hand for just a moment too long. She knows something.",
        },
      ],
    },
    {
      id: "scene_2",
      transitionNarration: "Twenty minutes later. The rooftop reception is in full swing. City lights stretch to the horizon. You spot Maya near the bar — but she's talking to someone you recognize from the Nexus Corp keynote.",
      narration: "The rooftop is crowded and loud. Perfect cover. Maya is deep in conversation with a tall man in a dark suit. He turns — and you recognize Director Chen, Nexus Corp's head of operations. The man your source was going to expose.",
      musicMood: "tense_building",
      beats: [
        {
          speaker: "narrator",
          text: "Director Chen spots you approaching. His expression doesn't change — but Maya's does. She looks nervous.",
        },
        {
          speaker: "chen",
          text: "Another journalist. I can always tell. You have that hungry look.",
          enterFrom: "left",
        },
        {
          speaker: null,
          text: null,
          choices: [
            { id: "c2a", text: "I'm just here for the free drinks, actually.", tone: "charming", icon: "✨" },
            { id: "c2b", text: "And you have the look of someone with something to hide.", tone: "aggressive", icon: "⚔️" },
            { id: "c2c", text: "Guilty as charged. Your keynote was impressive. Can I ask a few questions?", tone: "honest", icon: "💬" },
          ],
        },
        {
          speaker: "chen",
          text: "Ha. Then you'll love the whiskey bar on the second floor. Now, if you'll excuse us.",
          afterChoice: "c2a",
        },
        {
          speaker: "chen",
          text: "Interesting approach. Most people at least pretend to be polite before accusing me of things.",
          afterChoice: "c2b",
        },
        {
          speaker: "chen",
          text: "Of course. But not tonight. My assistant can schedule something. Enjoy the view.",
          afterChoice: "c2c",
        },
        {
          speaker: "narrator",
          text: "As Chen walks away, Maya catches your arm. Her voice drops to a whisper.",
        },
        {
          speaker: "maya",
          text: "Meet me by the service elevator in five minutes. Don't let Chen see you leave. I know why Alex didn't show up.",
        },
      ],
    },
    {
      id: "scene_3",
      transitionNarration: "The service corridor behind the reception hall. Fluorescent lights buzz overhead. The sound of the party is muffled through the walls. Maya is already there, pacing.",
      narration: "Maya stands near the service elevator. She looks different now — the polished organizer mask is gone. She's scared.",
      musicMood: "suspenseful_quiet",
      beats: [
        {
          speaker: "maya",
          text: "Alex contacted me two days ago. Said they had proof — financial records, internal memos. Something about a deal Nexus made with a government they shouldn't have.",
        },
        {
          speaker: "maya",
          text: "I was supposed to get them into the VIP dinner tonight. But this morning, I got a message from Alex's number saying they were 'no longer attending.' Except...",
        },
        {
          speaker: "narrator",
          text: "Maya holds up her phone. The message is there — but the writing style is different. Formal. Clipped. Not like a person. Like it was generated.",
        },
        {
          speaker: null,
          text: null,
          choices: [
            { id: "c3a", text: "Someone sent that message for Alex. They've been compromised.", tone: "honest", icon: "💬" },
            { id: "c3b", text: "How do I know you're not the one who compromised them?", tone: "aggressive", icon: "⚔️" },
            { id: "c3c", text: "Where was Alex staying? We need to check their room. Now.", tone: "curious", icon: "🔍" },
          ],
        },
        {
          speaker: "maya",
          text: "I know. And I think Chen knows too. He asked me tonight if any 'independent consultants' had checked in. He used that exact phrase.",
          afterChoice: "c3a",
        },
        {
          speaker: "maya",
          text: "Fair question. But if I wanted to stop this story, why would I be standing in a service corridor telling you everything?",
          afterChoice: "c3b",
        },
        {
          speaker: "maya",
          text: "Room 1407. I have a master key from the event setup. But if we go now, we can't come back to the party without being noticed.",
          afterChoice: "c3c",
        },
        {
          speaker: "narrator",
          text: "The service elevator dings. The doors slide open. It's empty. Maya looks at you.",
        },
        {
          speaker: "maya",
          text: "Are you coming?",
        },
        {
          speaker: "narrator",
          text: "To be continued...",
        },
      ],
    },
  ],

  summary: {
    title: "Episode 1 Complete",
    teaser: "But the encrypted file on Alex's laptop wasn't what either of you expected...",
  },
};

export const getCharacterById = (id: string) => {
  return MOCK_STORY.characters.find(c => c.id === id);
};

export const getSceneByIndex = (index: number) => {
  return MOCK_STORY.scenes[index];
};
