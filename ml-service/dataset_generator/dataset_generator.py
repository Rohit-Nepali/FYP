import random
import csv
import re
from pathlib import Path

# ══════════════════════════════════════════════════════════════════
# CONFIGURATION — edit these as needed
# ══════════════════════════════════════════════════════════════════
TARGET_PER_LABEL    = 1250    # 1250 x 8 labels = 10,000 total unique samples
MAX_ATTEMPT_MULT    = 40      # tries up to 40x target per label before giving up
OUTPUT_FILE         = "productivity_dataset_4.csv"
RANDOM_SEED         = 42

# ══════════════════════════════════════════════════════════════════
# BASE SENTENCE LIBRARY  (40 sentences per label)
# Large pool is the primary driver of unique combinations
# ══════════════════════════════════════════════════════════════════
expanded_labels = {
    "WORK_OVERLOAD": [
        "My inbox is overflowing",
        "I have too many deadlines at once",
        "The project scope keeps expanding",
        "I'm drowning in paperwork",
        "My calendar is completely double-booked",
        "There are too many moving parts",
        "I have a mountain of tasks to get through",
        "The workload is simply unsustainable",
        "I'm stretched way too thin right now",
        "There's just too much on my plate",
        "I can't keep up with everything coming in",
        "My to-do list never seems to get shorter",
        "I'm juggling too many things at once",
        "I have back-to-back meetings all day long",
        "Every single hour something new gets added",
        "I don't have enough hours in the day",
        "The number of tasks just keeps growing",
        "I'm handling work from multiple teams simultaneously",
        "I have absolutely no breathing room",
        "It feels like I'm working non-stop",
        "I'm responsible for far too many deliverables",
        "My workload doubled out of nowhere",
        "I can't finish one thing before three more appear",
        "Every team seems to need something from me",
        "I'm completely overcommitted this week",
        "There is no end to the list of things I need to do",
        "I'm handling tasks that should belong to two people",
        "My pipeline is totally backed up",
        "I have more work than hours to do it",
        "I said yes to too many things and now I'm drowning",
        "The requests just keep flooding in",
        "I'm buried under an avalanche of work",
        "My plate was already full and more got added",
        "I have zero capacity left for anything new",
        "I'm at my absolute limit with the current workload",
        "Every task is urgent and I can't prioritize",
        "The scope of this project alone is overwhelming",
        "I can't catch a break between all these demands",
        "My bandwidth is completely maxed out",
        "I've taken on more than any one person can handle"
    ],
    "FORGETFULNESS": [
        "It completely slipped my mind",
        "I left the file at home by mistake",
        "I missed the deadline without realizing it",
        "I blanked on the instructions entirely",
        "I forgot to hit send on the email",
        "I can't remember the details at all",
        "I totally forgot about the meeting",
        "It just slipped through the cracks",
        "I didn't realize it was due today",
        "I lost track of that task entirely",
        "I thought someone else was handling it",
        "I missed the reminder notification",
        "I kept meaning to do it but kept forgetting",
        "I mixed up the dates completely",
        "I remembered far too late to fix it",
        "The task wasn't on my radar at all",
        "I overlooked it while dealing with other things",
        "It got buried deep in my notes",
        "I didn't write it down in time",
        "I simply forgot it even existed",
        "It didn't cross my mind until it was too late",
        "I was so busy I let it fall off my list",
        "I forgot to follow up after the last meeting",
        "I assumed I had more time and forgot entirely",
        "I meant to set a reminder but never did",
        "The task got lost among everything else I was doing",
        "I spaced out and the deadline passed me by",
        "I never added it to my calendar",
        "I thought I had already completed it but hadn't",
        "I got busy and it slipped completely out of my head",
        "I forgot to check back on that item",
        "I missed the message asking me to do it",
        "I completely lost track of the due date",
        "I failed to remember it despite knowing it was important",
        "I just couldn't recall what was needed",
        "I thought I had more time than I actually did",
        "I forgot who I was supposed to hand it off to",
        "It wasn't in my system so I forgot about it",
        "I let it sit untouched for too long",
        "I overlooked it in my inbox and it expired"
    ],
    "LOW_ENERGY": [
        "I'm running on fumes today",
        "I can barely keep my eyes open",
        "I feel like a complete zombie",
        "I have zero mental bandwidth left",
        "My brain is extremely foggy",
        "I'm physically and mentally exhausted",
        "I feel totally and completely drained",
        "I have no energy left whatsoever",
        "I've been feeling burnt out for a while",
        "I couldn't even get out of bed this morning",
        "I'm mentally checked out today",
        "I'm too tired to think straight",
        "I haven't been sleeping well at all",
        "I feel completely and utterly wiped out",
        "My body just won't cooperate today",
        "I'm running at maybe twenty percent capacity",
        "I feel sluggish for the entire day",
        "My head is too heavy to concentrate",
        "I feel exhausted even after resting",
        "I'm not in the right headspace to work",
        "I have no spark left in me today",
        "I feel like I'm moving through mud",
        "Even small tasks feel impossible right now",
        "I woke up already feeling tired",
        "My energy crashed after lunch and never came back",
        "I'm fighting through serious brain fog",
        "I've been running low on sleep all week",
        "I feel emotionally and physically depleted",
        "I'm operating below my usual capacity",
        "My concentration keeps slipping because I'm so tired",
        "I feel drained before the day even starts",
        "I can't get motivated because I'm so exhausted",
        "I need a break but I can't stop right now",
        "I feel like I've been pushing too hard for too long",
        "I have nothing left to give today",
        "My mind keeps shutting down on me",
        "I'm so fatigued I can barely form thoughts",
        "I'm running on caffeine and nothing else",
        "I've hit a wall and can't push through it",
        "I feel completely hollowed out from fatigue"
    ],
    "PROCRASTINATION": [
        "I'll just do it tomorrow instead",
        "I'm scrolling through my phone instead of working",
        "I keep avoiding the hard stuff",
        "I'm just staring blankly at the screen",
        "I'm putting it off again",
        "I'm wasting time on purpose",
        "I'll start in just ten more minutes",
        "I'm finding every possible way to delay",
        "I keep making excuses not to start",
        "I've been saying I'll do it all week",
        "I watched videos for an hour instead of working",
        "I rearranged my desk rather than starting the task",
        "I opened the task and immediately closed it",
        "I'm not ready to face that task yet",
        "I told myself I'd do it right after lunch",
        "I'm dragging my feet on this one badly",
        "I'll feel more motivated later, maybe",
        "I opened ten other browser tabs to avoid it",
        "I started on something much easier instead",
        "I just couldn't bring myself to begin",
        "I cleaned my whole room instead of working",
        "I keep pushing the start time back",
        "I've been meaning to start but something always comes up",
        "I find any excuse to not sit down and do it",
        "I know I should do it but I just can't",
        "I spent the morning on low-priority things to avoid it",
        "Every time I think about it I put it off",
        "I've procrastinated on this for three days now",
        "I started the task twice and stopped both times",
        "I delay because I don't know where to begin",
        "I keep telling myself one more hour won't hurt",
        "I'm avoiding it because it feels overwhelming",
        "I chose easy tasks and ignored the important one",
        "I've been convincing myself I work better under pressure",
        "I rationalize every delay with an excuse",
        "I'm scared to start because I might fail",
        "I distract myself intentionally to avoid this task",
        "I've had this on my list for days and done nothing",
        "I keep waiting for the perfect moment to start",
        "I did everything except the one thing I needed to do"
    ],
    "POOR_PLANNING": [
        "I didn't prioritize correctly at all",
        "I jumped in completely without a roadmap",
        "My entire schedule is a total mess",
        "I had no idea how long this would take",
        "I have absolutely no clear structure",
        "I badly underestimated the effort required",
        "My plan fell apart almost immediately",
        "I had no clear goal going into this",
        "I skipped the planning phase entirely",
        "I didn't break the work down into smaller steps",
        "I allocated completely the wrong amount of time",
        "I started on the wrong task first",
        "I had no deadline set for any of the subtasks",
        "I didn't account for task dependencies at all",
        "I thought it would be much simpler than it turned out",
        "I misjudged what resources I would need",
        "I set completely unrealistic targets for myself",
        "I didn't review my plan at all before starting",
        "I ignored all the early warning signs",
        "I had only a rough idea and no real plan",
        "I went in blind and paid the price",
        "I planned for the best case and got the worst",
        "I didn't leave any buffer time in my schedule",
        "I failed to identify risks before starting",
        "I didn't communicate the timeline to anyone",
        "My estimates were completely off from the beginning",
        "I didn't define what done even looks like",
        "I started without checking if I had all the tools",
        "I didn't map out the steps before diving in",
        "I overlooked a key dependency that blocked everything",
        "I didn't set clear milestones along the way",
        "I assumed others knew what I needed without asking",
        "I didn't validate my approach before committing to it",
        "I skipped scoping and ended up in scope creep",
        "I started on the hardest part with no preparation",
        "My priorities were completely out of order",
        "I had no contingency plan when things went wrong",
        "I created a plan but never actually followed it",
        "I changed direction midway with no updated plan",
        "I underplanned and the gaps showed immediately"
    ],
    "DISTRACTION": [
        "My phone keeps blowing up with notifications",
        "The office is way too loud to focus",
        "I keep getting pulled away from my work",
        "I'm getting pinged literally every minute",
        "The background noise is incredibly distracting",
        "I can't stop checking the news",
        "Constant notifications are completely ruining my focus",
        "Someone kept interrupting me all day",
        "I got completely sucked into social media",
        "There was just too much going on around me",
        "My coworkers kept stopping by to chat",
        "I couldn't find a single quiet place to work",
        "Every app on my phone kept sending me alerts",
        "I got sidetracked by an unrelated problem",
        "My environment is not helping me focus at all",
        "I lost a full hour to random browsing",
        "The background noise completely breaks my concentration",
        "I got pulled into someone else's urgent issue",
        "I can't seem to ignore what's going on around me",
        "There were far too many interruptions today",
        "My open office makes it impossible to concentrate",
        "I kept checking messages every five minutes",
        "An urgent call derailed my entire afternoon",
        "I couldn't get into flow because of constant breaks",
        "My attention kept jumping between things",
        "I was context-switching so much nothing got done",
        "The TV was on and I couldn't ignore it",
        "A group conversation nearby kept pulling me in",
        "I got distracted and lost my train of thought repeatedly",
        "I was in and out of meetings all day long",
        "I spent more time reacting than actually doing work",
        "The chaos around me made deep work impossible",
        "I fell into a YouTube rabbit hole mid-afternoon",
        "I kept getting tagged in chats that weren't relevant",
        "My focus was shattered by back-to-back interruptions",
        "I couldn't stay on task with so many things happening",
        "I let social media steal two hours from my day",
        "I responded to every ping immediately instead of focusing",
        "The environment wasn't set up for productive work",
        "I got derailed by a side conversation that ran too long"
    ],
    "CONSISTENT_PRODUCTIVITY": [
        "I'm completely in the zone right now",
        "I'm checking things off one by one",
        "I've been in a solid flow state all morning",
        "I'm making steady and consistent progress",
        "I finished everything on my list today",
        "I'm actually ahead of schedule",
        "Everything is running really smoothly",
        "I'm staying perfectly on track",
        "I completed every single task today",
        "I've been incredibly focused all week",
        "I hit every milestone exactly on time",
        "I wrapped up the work well ahead of the deadline",
        "I felt productive from the very start to finish",
        "I managed my time really well today",
        "I delivered everything exactly as planned",
        "I didn't waste a single hour today",
        "I kept my momentum going the whole day",
        "I finished early and even helped a teammate",
        "I crossed everything off my list before end of day",
        "I had a genuinely solid and productive day of work",
        "I cleared my entire backlog this afternoon",
        "I knocked out three big tasks before noon",
        "I've been executing without any major hiccups",
        "My output today was better than usual",
        "I plowed through my list without any distractions",
        "I stayed focused and delivered quality work",
        "I got more done today than I expected",
        "Everything I touched today got completed",
        "I finished the hardest task first and built momentum",
        "I had a clean and efficient workflow all day",
        "I stayed disciplined and it really paid off",
        "I reviewed and closed out every open item",
        "I worked at a great pace and didn't burn out",
        "I was deeply focused for most of the day",
        "I followed my plan and it worked perfectly",
        "I blocked out distractions and got into flow",
        "I tackled every priority before looking at anything else",
        "I had one of my most productive days in weeks",
        "I stayed organized and nothing fell through the cracks",
        "I wrapped up early and still had energy left"
    ],
    "HIGH_MOTIVATION": [
        "I'm completely fired up to finish this",
        "I'm feeling incredibly inspired today",
        "I'm absolutely crushing all my goals",
        "I feel completely unstoppable right now",
        "I'm genuinely excited about this work",
        "I'm very eager to get started on this",
        "I have so much drive and energy today",
        "I woke up already ready to take on everything",
        "I feel deeply passionate about this project",
        "I'm more motivated than I've been in months",
        "Nothing is going to stop me today",
        "I have a clear vision and I'm going after it",
        "I want to give this absolutely my best shot",
        "I'm fully energized and ready to push hard",
        "I feel like I can handle absolutely anything right now",
        "I'm fully committed to seeing this through",
        "I'm pushing myself to do better than before",
        "I set a big goal and I'm going all in",
        "I feel a really strong sense of purpose today",
        "I'm completely determined to make real progress",
        "I feel a rush of energy every time I think about this",
        "I want to prove to myself that I can do this",
        "I'm going into today with everything I have",
        "I feel aligned with what I'm working on",
        "I can't wait to see what I accomplish by end of today",
        "I'm in the best headspace I've been in all month",
        "I feel a strong drive to deliver something great",
        "I'm channeling all my energy into this right now",
        "I'm showing up today with full commitment",
        "I feel like everything is clicking into place",
        "I have relentless energy to push this forward",
        "I'm motivated by how close I am to finishing",
        "I feel inspired by the challenge in front of me",
        "I'm going to give this everything I have today",
        "My confidence is high and I'm ready to deliver",
        "I feel sharp, focused, and ready to go",
        "I'm fuelled by purpose and ready to perform",
        "The goal is clear and I will not stop until I reach it",
        "I feel momentum building and I'm leaning into it",
        "I'm on fire today and nothing is slowing me down"
    ]
}

informal_bases = {
    "WORK_OVERLOAD": [
        "swamped right now",
        "buried in tasks",
        "too much on me",
        "my plate is full",
        "cant breathe this week",
        "requests keep piling up",
        "inbox is wild",
        "so behind on everything",
        "drowning in stuff",
        "calendar is chaos",
        "every task is urgent",
        "no room for more",
        "im maxed out",
        "just got slammed again",
        "stacked with deadlines",
        "work keeps flooding in",
        "buried all day",
        "too many asks",
        "im cooked by noon",
        "cant keep up",
        "nonstop since morning",
        "deadline pile is crazy",
        "team keeps adding more",
        "completely overloaded rn",
        "still catching up",
        "my queue is packed",
        "im drowning again",
        "way too many deliverables",
        "no bandwidth left",
        "work avalanche today",
        "everything is due",
        "so much to juggle",
        "back to back all day",
        "totally swamped rn",
        "buried and stressed",
        "so much to do and no energy for it",
        "too much work and zero energy left",
        "overwhelmed and exhausted at the same time",
        "too tired to handle everything on my plate",
    ],
    "FORGETFULNESS": [
        "blanked on it",
        "spaced and forgot",
        "totally slipped my mind",
        "forgot again today",
        "missed it somehow",
        "i blanked hard",
        "spaced out on that",
        "forgot to send it",
        "forgot the deadline",
        "lost track again",
        "never wrote it down",
        "didnt remember at all",
        "brain just blanked",
        "forgot after the meeting",
        "i spaced completely",
        "that one vanished",
        "missed the reminder",
        "totally forgot rn",
        "forgot what was needed",
        "it escaped me",
        "i forgot to follow up",
        "blanked on details",
        "spaced on the date",
        "lost it in my notes",
        "i forgot it existed",
        "mind went empty",
        "forgot who needed it",
        "missed that message",
        "forgot to check back",
        "brain lagged hard",
        "never added calendar",
        "forgot to do that",
        "spaced till too late",
        "just blanked tbh",
        "forgot it again",
    ],
    "LOW_ENERGY": [
        "mentally gone rn",
        "brain is fried",
        "im gassed",
        "running on fumes",
        "so drained today",
        "dead tired now",
        "energy is zero",
        "im cooked already",
        "barely awake",
        "zombie mode all day",
        "cant think straight",
        "battery is empty",
        "no motivation at all",
        "zero motivation today",
        "motivation is gone",
        "no drive whatsoever",
        "cant feel motivated",
        "totally wiped out",
        "so low energy",
        "my brain is slow",
        "sleep debt hit hard",
        "foggy all morning",
        "dragging myself today",
        "fried since lunch",
        "too tired to focus",
        "i feel hollow",
        "nothing left today",
        "running on caffeine",
        "hit a wall",
        "cant keep eyes open",
        "fried and sluggish",
        "mentally checked out",
        "gassed before noon",
        "drained beyond words",
        "low power mode",
        "no spark today",
        "head feels heavy",
        "so exhausted rn",
        "fried brain only",
        "empty tank today",
    ],
    "PROCRASTINATION": [
        "havent started yet",
        "cant start still",
        "still avoiding it",
        "ill do it later",
        "kept delaying again",
        "put it off today",
        "doom scrolling instead",
        "just tabbing out",
        "i keep dodging it",
        "opened it then closed",
        "stuck avoiding the task",
        "found excuses all day",
        "waiting for motivation",
        "pushing start time",
        "another day avoiding",
        "not touching it",
        "still didnt begin",
        "kept stalling",
        "ended up watching tv instead",
        "went down a netflix hole",
        "watched videos for hours",
        "spent hours on youtube",
        "binge watched instead of working",
        "procrastinating hard rn",
        "doing anything else",
        "cant get myself to start",
        "one more minute loop",
        "i keep postponing",
        "dragging this out",
        "late start again",
        "dodged it all morning",
        "avoided the hard part",
        "stared at screen",
        "kept putting it back",
        "not now maybe later",
        "just scrolling around",
        "delayed it again",
        "did easy stuff instead",
        "still not started",
        "avoidance mode active",
        "havent touched it in days",
        "lol havent started it",
        "still havent done that task",
        "havent looked at it in days",
    ],
    "POOR_PLANNING": [
        "just winging it",
        "no plan at all",
        "made it up",
        "totally unprepared",
        "timeline is a mess",
        "forgot to prioritize",
        "wrong task first",
        "no roadmap here",
        "didnt map steps",
        "underestimated everything",
        "plan fell apart",
        "no buffer time",
        "guessed the effort",
        "bad sequencing today",
        "scope got messy",
        "i jumped in blind",
        "no clear milestones",
        "didnt think it through",
        "just vibes no plan",
        "missed dependencies",
        "schedule is chaos",
        "started without prep",
        "priorities were off",
        "changed direction mid way",
        "no fallback plan",
        "estimated way too low",
        "planned nothing properly",
        "forgot key steps",
        "structure is missing",
        "im winging this",
        "random order all day",
        "did not scope it",
        "planless and stressed",
        "rough idea only",
        "messy execution today",
    ],
    "DISTRACTION": [
        "kept tabbing out",
        "doom scrolling again",
        "phone kept buzzing",
        "cant lock in",
        "mind keeps wandering",
        "pinged nonstop",
        "kept switching tabs",
        "lost in notifications",
        "focus kept breaking",
        "chat messages nonstop",
        "sidetracked all morning",
        "couldnt stay on task",
        "noise ruined focus",
        "random browsing spiral",
        "got pulled away",
        "too many interruptions",
        "went down a rabbit hole",
        "attention all over",
        "kept checking socials",
        "multitasking wrecked me",
        "every ping distracted me",
        "derailed by side chats",
        "context switching nonstop",
        "could not concentrate",
        "focus lasted minutes",
        "tab hopping all day",
        "got distracted instantly",
        "brain keeps drifting",
        "reacting not working",
        "scroll loop happened",
        "couldnt hold attention",
        "constant interruptions today",
        "focus got shattered",
        "attention span vanished",
        "kept drifting off",
    ],
    "CONSISTENT_PRODUCTIVITY": [
        "crushing it today",
        "locked in all day",
        "steady progress rn",
        "in flow mode",
        "getting stuff done",
        "checking tasks off",
        "on track all day",
        "clean execution today",
        "finished everything early",
        "solid output today",
        "deep work hit",
        "momentum stayed high",
        "smooth focus blocks",
        "productive from morning",
        "stacked wins today",
        "list is cleared",
        "consistent pace all day",
        "kept moving forward",
        "good rhythm today",
        "nailed the priorities",
        "zero drift today",
        "sharp and focused",
        "workflow felt smooth",
        "tasks done on time",
        "progress never stalled",
        "i stayed disciplined",
        "great pace today",
        "actually ahead today",
        "wrapped up early",
        "strong execution today",
        "locked in rn",
        "kept momentum up",
        "very productive day",
        "flow stayed steady",
        "high output mode",
    ],
    "HIGH_MOTIVATION": [
        "so pumped today",
        "hyped to start",
        "ready to go",
        "super motivated rn",
        "fired up now",
        "cant wait to start",
        "feeling unstoppable",
        "full send today",
        "energy is high",
        "lets do this",
        "driven all morning",
        "locked and loaded",
        "goal mode active",
        "really inspired today",
        "hungry to finish",
        "amped up rn",
        "strong drive today",
        "ready for the grind",
        "all in today",
        "motivated beyond usual",
        "i feel hyped",
        "big energy today",
        "keen to build",
        "want to push hard",
        "dialed in and eager",
        "feeling pumped up",
        "focused and hungry",
        "i want this",
        "determined and ready",
        "motivated to execute",
        "momentum feels strong",
        "excited to work",
        "hyped for this",
        "ready to crush it",
        "fully motivated rn",
    ],
}

# ══════════════════════════════════════════════════════════════════
# AUGMENTATION POOLS  (larger pools = more unique combinations)
# ══════════════════════════════════════════════════════════════════
synonyms = {
    "tasks":       ["work", "items", "assignments", "responsibilities", "to-dos", "action items"],
    "meeting":     ["call", "sync", "standup", "session", "appointment", "check-in"],
    "focus":       ["concentration", "attention", "flow", "momentum", "clarity"],
    "deadline":    ["due date", "cutoff", "target date", "submission date", "end date"],
    "finish":      ["complete", "wrap up", "get done", "finalize", "close out"],
    "start":       ["begin", "kick off", "initiate", "get going on", "get started on"],
    "work":        ["job", "assignments", "responsibilities", "tasks", "projects"],
    "tired":       ["exhausted", "drained", "worn out", "fatigued", "depleted"],
    "plan":        ["roadmap", "schedule", "strategy", "structure", "approach"],
    "important":   ["critical", "essential", "key", "high-priority", "vital"],
    "today":       ["right now", "at the moment", "this week", "lately", "these days"],
    "completely":  ["totally", "entirely", "absolutely", "utterly", "fully"],
    "really":      ["truly", "genuinely", "very", "seriously", "actually"],
}

prefixes = [
    "Honestly,", "Ugh,", "So,", "I think", "Basically,",
    "To be real,", "Not gonna lie,", "Tbh,", "I mean,",
    "It's just that", "The truth is,", "I guess", "Sadly,",
    "Look,", "To put it simply,", "I'll be honest,",
    "Between you and me,", "If I'm being transparent,",
    "At the end of the day,", "Let's be honest,",
    "I have to admit,", "No sugarcoating it,",
    "In all honesty,", "Just to be upfront,",
]

suffixes = [
    "and it's really getting to me.",
    "so I fell behind on everything.",
    "which didn't help at all.",
    "and I couldn't catch up in time.",
    "so the task got pushed back.",
    "unfortunately.",
    "and I really regret it.",
    "so I lost track of things.",
    "and that's why I missed it.",
    "more than usual today.",
    "so it slipped completely.",
    "and I need to fix that soon.",
    "which is frustrating.",
    "and I'm not sure how to recover.",
    "so nothing got done.",
    "and it keeps happening.",
    "which cost me the whole afternoon.",
    "and I feel terrible about it.",
    "so I'm behind now.",
    "which I should have seen coming.",
    "and it threw me off completely.",
    "and I'm disappointed in myself.",
]

context_injectors = [
    "for the client presentation",
    "for the upcoming sprint review",
    "on that quarterly report",
    "related to the ongoing project",
    "because of the recent team changes",
    "due to a personal situation",
    "given everything happening this week",
    "because of the unexpected system downtime",
    "since we shifted priorities last minute",
    "after the last-minute scope change",
    "for the product launch deadline",
    "because the requirements kept changing",
    "after the manager reassigned the work",
    "since the original plan was scrapped",
    "due to some unplanned blockers",
    "for the board meeting next week",
    "since the team is short-staffed",
    "because I was waiting on approval",
    "given the tight turnaround time",
    "after being pulled into another project",
]

mid_fillers = [
    "honestly", "genuinely", "clearly", "obviously", "frankly",
    "seriously", "literally", "truly", "basically", "really",
]


# ══════════════════════════════════════════════════════════════════
# AUGMENTATION FUNCTIONS
# ══════════════════════════════════════════════════════════════════
def apply_synonym_swap(text):
    """
    Swap recognized words with synonyms.
    Checks on lowercased copy but replaces in original to preserve casing.
    Avoids partial-word matches (e.g. 'start' inside 'starting').
    """
    for word, options in synonyms.items():
        if f" {word} " in f" {text.lower()} ":
            replacement = random.choice(options)
            idx = text.lower().find(word)
            if idx != -1:
                text = text[:idx] + replacement + text[idx + len(word):]
    return text


def inject_mid_filler(text):
    """Insert a filler adverb after the first few words to add variety."""
    words = text.split()
    if len(words) > 3:
        insert_pos = random.randint(1, min(4, len(words) - 1))
        words.insert(insert_pos, random.choice(mid_fillers))
        return " ".join(words)
    return text


def augment_text(base_text, all_sentences):
    """
    Stack multiple independent augmentation strategies.
    Each strategy fires independently — more combinations = more unique outputs.
    """
    text = base_text

    # Strategy 1: Synonym swap — always applied
    text = apply_synonym_swap(text)

    # Strategy 1 : noise - real human slang
    text = apply_noise(text)

    # Strategy 2: Mid-sentence filler injection (25% chance)
    if random.random() < 0.25:
        text = inject_mid_filler(text)

    # Strategy 3: Human-sounding prefix (45% chance)
    if random.random() < 0.45:
        text = f"{random.choice(prefixes)} {text}"

    # Strategy 4: Task context injector at end (35% chance)
    if random.random() < 0.35:
        text = f"{text} {random.choice(context_injectors)}"

    # Strategy 5: Natural suffix (30% chance)
    if random.random() < 0.30:
        text = f"{text} {random.choice(suffixes)}"

    # Strategy 6: Combine with second sentence from same label (25% chance)
    if random.random() < 0.25:
        second = random.choice(all_sentences)
        if second.strip().lower() != base_text.strip().lower():
            text = f"{text}. {second}"

    return text

def apply_noise(text):
    """
    Randomly applies real-world typing noise to a sentence.
    Simulates how actual users type informally.
    Fires on 55% of samples to better mimic real user input.
    """
    if random.random() > 0.55:
        return text  # 45% of sentences stay clean

    noise_type = random.choice(["typo", "slang", "truncate", "no_punct"])

    if noise_type == "typo":
        # Randomly double or drop a character
        words = text.split()
        if words:
            idx = random.randint(0, len(words) - 1)
            word = words[idx]
            if len(word) > 3:
                char_idx = random.randint(1, len(word) - 2)
                words[idx] = word[:char_idx] + word[char_idx + 1:]  # drop a char
            words[idx] = words[idx]
        return " ".join(words)

    elif noise_type == "slang":
        # Replace common words with slang equivalents
        slang_map = {
            "not going to": "not gonna",
            "as soon as possible": "asap",
            "to be honest": "tbh",
            "by the way": "btw",
            "i don't know": "idk",
            "should have": "shoulda",
            "would have": "woulda",
            "could have": "coulda",
            "have to": "hafta",
            "got to": "gotta",
            "what is": "whats",
            "it is": "its",
            "that is": "thats",
            "because": "bc",
            "though": "tho",
            "something": "smth",
            "probably": "prob",
            "definitely": "def",
            "really": "rly",
            "i am": "im",
            "i have": "ive",
            "i will": "ill",
            "cannot": "cant",
            "do not": "dont",
            "going to": "gonna",
            "want to": "wanna",
            "kind of": "kinda",
            "sort of": "sorta",
            "a lot": "alot",
            "right now": "rn",
        }
        lower = text.lower()
        for formal, informal in slang_map.items():
            if formal in lower:
                text = lower.replace(formal, informal)
                break
        return text

    elif noise_type == "truncate":
        # Cut sentence short like a rushed user
        words = text.split()
        if len(words) > 4:
            cut = random.randint(3, len(words) - 1)
            return " ".join(words[:cut])
        return text

    elif noise_type == "no_punct":
        # Remove all punctuation — like fast typing
        return re.sub(r"[^\w\s]", "", text)

    return text

def apply_casing(text):
    """
    Removed ALL CAPS and all-lowercase variants.
    These collapse into duplicates after cleaning.
    Keeping only normal and first-word-lowercase (texting style).
    """
    r = random.random()
    if r < 0.20:
        # First word lowercase — texting style e.g. "honestly, I'm tired"
        words = text.split()
        if words:
            words[0] = words[0].lower()
        return " ".join(words)
    return text  # normal casing (80%)


def canonical_key(text):
    """Canonical key used for deduplication and overlap reduction."""
    cleaned = re.sub(r"[^a-z0-9\s']", "", text.lower())
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned

real_world_samples = [
    ("so behind its not funny", "WORK_OVERLOAD"),
    ("buried in work again", "WORK_OVERLOAD"),
    ("swamped all week", "WORK_OVERLOAD"),
    ("too many deadlines rn", "WORK_OVERLOAD"),
    ("inbox is exploding", "WORK_OVERLOAD"),
    ("drowning in tasks today", "WORK_OVERLOAD"),
    ("everything is urgent somehow", "WORK_OVERLOAD"),
    ("workload went crazy overnight", "WORK_OVERLOAD"),
    ("no bandwidth left today", "WORK_OVERLOAD"),
    ("my queue is insane", "WORK_OVERLOAD"),

    ("mentally gone rn", "LOW_ENERGY"),
    ("brain is fried today", "LOW_ENERGY"),
    ("im cooked already", "LOW_ENERGY"),
    ("running on fumes still", "LOW_ENERGY"),
    ("dead tired since morning", "LOW_ENERGY"),
    ("gassed before lunch", "LOW_ENERGY"),
    ("energy crashed hard", "LOW_ENERGY"),
    ("cant think straight today", "LOW_ENERGY"),
    ("zero battery left", "LOW_ENERGY"),
    ("fried and slow rn", "LOW_ENERGY"),

    ("havent even looked at it lol", "PROCRASTINATION"),
    ("still avoiding it", "PROCRASTINATION"),
    ("kept pushing it back", "PROCRASTINATION"),
    ("ill start later maybe", "PROCRASTINATION"),
    ("opened it then bailed", "PROCRASTINATION"),
    ("doom scrolling instead", "PROCRASTINATION"),
    ("found excuses all day", "PROCRASTINATION"),
    ("cant start for some reason", "PROCRASTINATION"),
    ("kept delaying the hard part", "PROCRASTINATION"),
    ("still not touching it", "PROCRASTINATION"),

    ("kept tabbing out all morning", "DISTRACTION"),
    ("phone kept stealing my focus", "DISTRACTION"),
    ("notifications ruined my day", "DISTRACTION"),
    ("doom scrolled for an hour", "DISTRACTION"),
    ("cant lock in today", "DISTRACTION"),
    ("attention kept jumping everywhere", "DISTRACTION"),
    ("got pulled into random chats", "DISTRACTION"),
    ("tab hopped all afternoon", "DISTRACTION"),
    ("lost in social apps", "DISTRACTION"),
    ("focus kept breaking nonstop", "DISTRACTION"),

    ("totally blanked on that", "FORGETFULNESS"),
    ("spaced and forgot again", "FORGETFULNESS"),
    ("it slipped my mind", "FORGETFULNESS"),
    ("forgot to send it", "FORGETFULNESS"),
    ("missed the due date", "FORGETFULNESS"),
    ("brain went empty", "FORGETFULNESS"),
    ("forgot right after meeting", "FORGETFULNESS"),
    ("lost track of it", "FORGETFULNESS"),
    ("didnt remember till late", "FORGETFULNESS"),
    ("forgot that task existed", "FORGETFULNESS"),

    ("just winging it tbh", "POOR_PLANNING"),
    ("no real plan here", "POOR_PLANNING"),
    ("started without thinking", "POOR_PLANNING"),
    ("timeline was pure guess", "POOR_PLANNING"),
    ("forgot to prioritize anything", "POOR_PLANNING"),
    ("did things in wrong order", "POOR_PLANNING"),
    ("underestimated every step", "POOR_PLANNING"),
    ("no buffer no backup", "POOR_PLANNING"),
    ("plan fell apart fast", "POOR_PLANNING"),
    ("made it up as i went", "POOR_PLANNING"),

    ("locked in today", "CONSISTENT_PRODUCTIVITY"),
    ("crushing it all day", "CONSISTENT_PRODUCTIVITY"),
    ("steady progress since morning", "CONSISTENT_PRODUCTIVITY"),
    ("cleared my list early", "CONSISTENT_PRODUCTIVITY"),
    ("flow state hit hard", "CONSISTENT_PRODUCTIVITY"),
    ("stayed on track all day", "CONSISTENT_PRODUCTIVITY"),
    ("finished every priority", "CONSISTENT_PRODUCTIVITY"),
    ("solid pace no drift", "CONSISTENT_PRODUCTIVITY"),
    ("deep work actually worked", "CONSISTENT_PRODUCTIVITY"),
    ("kept momentum till evening", "CONSISTENT_PRODUCTIVITY"),

    ("so pumped to start this", "HIGH_MOTIVATION"),
    ("hyped for this task", "HIGH_MOTIVATION"),
    ("feeling unstoppable today", "HIGH_MOTIVATION"),
    ("ready to crush this", "HIGH_MOTIVATION"),
    ("full energy all in", "HIGH_MOTIVATION"),
    ("im fired up rn", "HIGH_MOTIVATION"),
    ("cant wait to begin", "HIGH_MOTIVATION"),
    ("big drive today", "HIGH_MOTIVATION"),
    ("motivated like crazy", "HIGH_MOTIVATION"),
    ("lets go mode", "HIGH_MOTIVATION"),
]

short_samples = [
    ("swamped", "WORK_OVERLOAD"),
    ("buried rn", "WORK_OVERLOAD"),
    ("too much work", "WORK_OVERLOAD"),
    ("overloaded today", "WORK_OVERLOAD"),
    ("inbox chaos", "WORK_OVERLOAD"),

    ("dead tired", "LOW_ENERGY"),
    ("brain fried", "LOW_ENERGY"),
    ("so gassed", "LOW_ENERGY"),
    ("empty battery", "LOW_ENERGY"),
    ("running fumes", "LOW_ENERGY"),

    ("cant start", "PROCRASTINATION"),
    ("still avoiding", "PROCRASTINATION"),
    ("doing later", "PROCRASTINATION"),
    ("not started", "PROCRASTINATION"),
    ("delay loop", "PROCRASTINATION"),

    ("so distracted", "DISTRACTION"),
    ("tabbing out", "DISTRACTION"),
    ("doom scrolling", "DISTRACTION"),
    ("no focus", "DISTRACTION"),
    ("pinged nonstop", "DISTRACTION"),

    ("forgot again", "FORGETFULNESS"),
    ("blanked hard", "FORGETFULNESS"),
    ("spaced out", "FORGETFULNESS"),
    ("slipped mind", "FORGETFULNESS"),
    ("missed reminder", "FORGETFULNESS"),

    ("no plan", "POOR_PLANNING"),
    ("winging it", "POOR_PLANNING"),
    ("bad estimates", "POOR_PLANNING"),
    ("wrong order", "POOR_PLANNING"),
    ("messy timeline", "POOR_PLANNING"),

    ("crushing it", "CONSISTENT_PRODUCTIVITY"),
    ("locked in", "CONSISTENT_PRODUCTIVITY"),
    ("steady flow", "CONSISTENT_PRODUCTIVITY"),
    ("on track", "CONSISTENT_PRODUCTIVITY"),
    ("tasks cleared", "CONSISTENT_PRODUCTIVITY"),

    ("so pumped", "HIGH_MOTIVATION"),
    ("super hyped", "HIGH_MOTIVATION"),
    ("fired up", "HIGH_MOTIVATION"),
    ("ready now", "HIGH_MOTIVATION"),
    ("lets go", "HIGH_MOTIVATION"),
]

# ══════════════════════════════════════════════════════════════════
# DATASET GENERATION
# ══════════════════════════════════════════════════════════════════
random.seed(RANDOM_SEED)

labels_list = list(expanded_labels.keys())
seen_texts = set()
dataset_by_label = {label: [] for label in labels_list}


def try_add_sample(text, label):
    key = canonical_key(text)
    if not key or key in seen_texts:
        return False
    seen_texts.add(key)
    dataset_by_label[label].append([text.strip(), label])
    return True


# Seed the dataset with real-world examples first, while still preserving final balance.
for text, label in real_world_samples:
    if label in dataset_by_label:
        try_add_sample(text, label)

for text, label in short_samples:
    if label in dataset_by_label:
        try_add_sample(text, label)

print("Generating balanced, deduplicated dataset...\n")

for label in labels_list:
    formal_pool = expanded_labels[label]
    informal_pool = informal_bases[label]
    attempts = 0
    max_attempts = TARGET_PER_LABEL * MAX_ATTEMPT_MULT

    while len(dataset_by_label[label]) < TARGET_PER_LABEL and attempts < max_attempts:
        attempts += 1

        # 50/50 base selection between formal and informal sentence pools.
        base_sentences = informal_pool if random.random() < 0.5 else formal_pool

        # Pick base: single sentence (75%) or two combined (25%)
        if random.random() < 0.25:
            s1 = random.choice(base_sentences)
            s2 = random.choice(base_sentences)
            base = s1 if s1 == s2 else f"{s1}. {s2}"
        else:
            base = random.choice(base_sentences)

        text = augment_text(base, base_sentences)
        text = apply_casing(text)
        try_add_sample(text, label)

    count = len(dataset_by_label[label])
    status = "OK" if count == TARGET_PER_LABEL else "PARTIAL"
    print(f"  {status} {label:<30} {count:>5} samples  ({attempts} attempts)")

dataset = []
for label in labels_list:
    dataset.extend(dataset_by_label[label])

# Shuffle so labels are not grouped in the CSV.
random.shuffle(dataset)

# ══════════════════════════════════════════════════════════════════
# SAVE TO CSV
# ══════════════════════════════════════════════════════════════════
output_path = Path(__file__).resolve().parents[1] / "training" / "raw" / "classifier" / OUTPUT_FILE
output_path.parent.mkdir(parents=True, exist_ok=True)
with output_path.open("w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["text", "label"])
    writer.writerows(dataset)
# ══════════════════════════════════════════════════════════════════
# FINAL REPORT
# ══════════════════════════════════════════════════════════════════
total = len(dataset)
print(f"\n{'═'*52}")
print(f"  Total unique samples : {total}")
print(f"  Labels               : {len(labels_list)}")
print(f"  Avg per label        : {total // len(labels_list)}")
print(f"  Duplicate rate       : 0% by canonical key")
print(f"  Saved to             : {output_path}")
print(f"{'═'*52}")