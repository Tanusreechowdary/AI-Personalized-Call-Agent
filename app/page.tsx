"use client";

import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  Bell,
  BookUser,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Headphones,
  Inbox,
  ListFilter,
  Mic2,
  MoreHorizontal,
  Phone,
  PhoneCall,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Stars,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

type Call = {
  id: number;
  name: string;
  phone: string;
  initials: string;
  color: string;
  label?: string;
  time: string;
  duration: string;
  summary: string;
  transcript: string;
  status: "Message taken" | "Callback requested" | "Spam filtered";
};

const sampleCalls: Call[] = [
  {
    id: 1,
    name: "Maya Chen",
    phone: "(415) 555-0182",
    initials: "MC",
    color: "sage",
    label: "Mobile",
    time: "10:42 AM",
    duration: "2m 34s",
    summary: "Wants to confirm dinner plans for Friday at 7. Asked you to text her the address.",
    transcript:
      "Hi! Just calling to confirm we're still on for Friday. I was thinking around 7? Could you text me the address when you get a chance? Looking forward to it!",
    status: "Callback requested",
  },
  {
    id: 2,
    name: "Dr. Patel's Office",
    phone: "(415) 555-0136",
    initials: "DP",
    color: "lavender",
    label: "Work",
    time: "9:18 AM",
    duration: "1m 12s",
    summary: "Calling to confirm your appointment on Thursday, October 16 at 2:30 PM.",
    transcript:
      "This is a message from Dr. Patel's office. We're calling to confirm your appointment this Thursday, October 16th, at 2:30 PM. Please call us back if you need to reschedule.",
    status: "Message taken",
  },
  {
    id: 3,
    name: "Unknown caller",
    phone: "(888) 555-0199",
    initials: "?",
    color: "sand",
    time: "8:56 AM",
    duration: "0m 08s",
    summary: "Possible spam call. Filtered automatically.",
    transcript: "The call was flagged as likely spam and ended automatically.",
    status: "Spam filtered",
  },
  {
    id: 4,
    name: "Alex Rivera",
    phone: "(510) 555-0114",
    initials: "AR",
    color: "peach",
    label: "Mobile",
    time: "Yesterday",
    duration: "3m 06s",
    summary: "Shared the updated project timeline. Will email over the revised deck this afternoon.",
    transcript:
      "Hey, quick update on the project — we moved the review to next Wednesday. I'll send over the updated deck this afternoon so you have time to take a look.",
    status: "Message taken",
  },
];

type NavItem = {
  label: string;
  icon: typeof Inbox;
};

const mainNav: NavItem[] = [
  { label: "Overview", icon: AudioLines },
  { label: "Conversations", icon: Inbox },
  { label: "Contacts", icon: UsersRound },
];

const initialsStyle: Record<string, string> = {
  sage: "bg-[#e6eee4] text-[#57715c]",
  lavender: "bg-[#eeebf5] text-[#70648a]",
  sand: "bg-[#f2eee5] text-[#897a5e]",
  peach: "bg-[#f5e9e2] text-[#9a6c55]",
};

export default function Home() {
  const [activePage, setActivePage] = useState("Overview");
  const [agentEnabled, setAgentEnabled] = useState(true);
  const [callFilter, setCallFilter] = useState("All calls");
  const [query, setQuery] = useState("");
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [contactsAdded, setContactsAdded] = useState(false);

  const visibleCalls = useMemo(() => {
    const search = query.trim().toLowerCase();
    return sampleCalls.filter((call) => {
      const matchesSearch =
        !search ||
        [call.name, call.phone, call.summary].some((value) =>
          value.toLowerCase().includes(search),
        );
      const matchesFilter =
        callFilter === "All calls" ||
        (callFilter === "Messages" && call.status === "Message taken") ||
        (callFilter === "Callbacks" && call.status === "Callback requested") ||
        (callFilter === "Spam" && call.status === "Spam filtered");
      return matchesSearch && matchesFilter;
    });
  }, [callFilter, query]);

  return (
    <main className="min-h-screen bg-[#fbfbf8]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[248px] flex-col border-r border-[#e9eae5] bg-[#fdfdfb] px-5 py-6 md:flex">
        <button
          onClick={() => setActivePage("Overview")}
          className="mb-11 flex w-fit items-center gap-3 text-left"
          aria-label="Relay home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-[13px] bg-[#466d53] text-white">
            <AudioLines size={19} strokeWidth={2.1} />
          </span>
          <span>
            <span className="font-display block text-[17px] font-extrabold tracking-[-0.7px] text-[#303930]">
              relay
            </span>
            <span className="-mt-0.5 block text-[10px] font-medium tracking-[0.06em] text-[#969a91]">
              YOUR CALL ASSISTANT
            </span>
          </span>
        </button>

        <div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a2a59d]">
          Workspace
        </div>
        <nav aria-label="Main navigation" className="space-y-1">
          {mainNav.map(({ label, icon: Icon }) => {
            const active = activePage === label;
            return (
              <button
                key={label}
                onClick={() => setActivePage(label)}
                className={`flex h-10 w-full items-center gap-3 rounded-[10px] px-3 text-[13px] transition ${
                  active
                    ? "bg-[#edf2eb] font-semibold text-[#466d53]"
                    : "font-medium text-[#7d8178] hover:bg-[#f4f5f1] hover:text-[#40483e]"
                }`}
              >
                <Icon size={17} strokeWidth={active ? 2 : 1.8} />
                {label}
                {label === "Conversations" && (
                  <span className="ml-auto rounded-full bg-[#e9eae5] px-2 py-0.5 text-[10px] font-semibold text-[#81867d]">
                    4
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="mb-3 mt-9 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a2a59d]">
          Preferences
        </div>
        <nav aria-label="Preferences" className="space-y-1">
          <button
            onClick={() => setActivePage("Settings")}
            className={`flex h-10 w-full items-center gap-3 rounded-[10px] px-3 text-[13px] font-medium transition ${
              activePage === "Settings"
                ? "bg-[#edf2eb] font-semibold text-[#466d53]"
                : "text-[#7d8178] hover:bg-[#f4f5f1] hover:text-[#40483e]"
            }`}
          >
            <Settings2 size={17} strokeWidth={1.8} />
            Settings
          </button>
        </nav>

        <div className="mt-auto">
          <div className="mb-5 rounded-[13px] border border-[#e9eae5] bg-[#f9faf6] p-4">
            <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-[#555c51]">
              <ShieldCheck size={15} className="text-[#66856b]" />
              Private by design
            </div>
            <p className="m-0 text-[11px] leading-[1.7] text-[#8b8f86]">
              Your conversations are yours. Always.
            </p>
            <button
              onClick={() => setActivePage("Settings")}
              className="mt-2.5 text-[11px] font-semibold text-[#59765e] hover:underline"
            >
              Privacy settings <ArrowRight className="ml-1 inline" size={12} />
            </button>
          </div>
          <button className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-[#f4f5f1]">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e9e7de] text-[11px] font-semibold text-[#686855]">
              JM
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12px] font-semibold text-[#42473f]">
                Jordan Miller
              </span>
              <span className="block truncate text-[11px] text-[#999c94]">
                Personal account
              </span>
            </span>
            <MoreHorizontal size={17} className="text-[#999c94]" />
          </button>
        </div>
      </aside>

      <div className="md:pl-[248px]">
        <header className="sticky top-0 z-10 flex h-[68px] items-center justify-between border-b border-[#e9eae5] bg-[#fbfbf8]/95 px-5 backdrop-blur-sm sm:px-8 lg:px-10">
          <div className="flex items-center gap-2 text-[12px] text-[#9a9e95] md:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-[11px] bg-[#466d53] text-white">
              <AudioLines size={17} />
            </span>
            <span className="font-display text-[15px] font-extrabold text-[#303930]">
              relay
            </span>
          </div>
          <div className="hidden items-center gap-2 text-[12px] text-[#9a9e95] md:flex">
            <span>Workspace</span>
            <ChevronRight size={13} />
            <span className="font-medium text-[#50564c]">{activePage}</span>
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            <div className="hidden items-center gap-2 rounded-full border border-[#e8e9e3] bg-white px-3 py-1.5 sm:flex">
              <span
                className={`h-2 w-2 rounded-full ${
                  agentEnabled ? "bg-[#6d9c77]" : "bg-[#c8c9c2]"
                }`}
              />
              <span className="text-[11px] font-medium text-[#74796f]">
                {agentEnabled ? "Assistant is on" : "Assistant is off"}
              </span>
            </div>
            <button
              onClick={() => setShowNotifications((value) => !value)}
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#777c73] transition hover:bg-[#f0f1ec]"
              aria-label="Notifications"
            >
              <Bell size={17} strokeWidth={1.8} />
              <span className="absolute right-[8px] top-[7px] h-1.5 w-1.5 rounded-full bg-[#739377]" />
            </button>
            {showNotifications && (
              <div className="absolute right-5 top-[58px] w-[280px] rounded-2xl border border-[#e9eae5] bg-white p-4 shadow-xl sm:right-8">
                <div className="flex items-center justify-between">
                  <p className="m-0 text-[13px] font-semibold">You’re all caught up</p>
                  <button onClick={() => setShowNotifications(false)} aria-label="Close notifications">
                    <X size={15} className="text-[#85897f]" />
                  </button>
                </div>
                <p className="mb-0 mt-2 text-[12px] leading-5 text-[#83877f]">
                  Your assistant has handled 4 calls today. Nothing needs your attention.
                </p>
              </div>
            )}
            <span className="mx-0.5 h-6 w-px bg-[#e5e6df]" />
            <button
              onClick={() => setActivePage("Settings")}
              className="flex items-center gap-2 rounded-full text-[12px] font-medium text-[#62675e] hover:text-[#3f5d47]"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e9e7de] text-[10px] font-semibold text-[#686855]">
                JM
              </span>
              <span className="hidden sm:block">Jordan</span>
              <ChevronDown size={13} className="hidden text-[#92968d] sm:block" />
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-[1340px] px-5 pb-10 pt-8 sm:px-8 sm:pt-10 lg:px-10">
          {activePage === "Overview" && (
            <Overview
              agentEnabled={agentEnabled}
              onToggle={() => setAgentEnabled((value) => !value)}
              onViewConversations={() => setActivePage("Conversations")}
              onSelectCall={setSelectedCall}
              visibleCalls={visibleCalls}
              callFilter={callFilter}
              onFilterChange={setCallFilter}
              query={query}
              onQueryChange={setQuery}
            />
          )}
          {activePage === "Conversations" && (
            <Conversations
              visibleCalls={visibleCalls}
              callFilter={callFilter}
              onFilterChange={setCallFilter}
              query={query}
              onQueryChange={setQuery}
              onSelectCall={setSelectedCall}
            />
          )}
          {activePage === "Contacts" && (
            <Contacts
              added={contactsAdded}
              onAdd={() => setContactsAdded((value) => !value)}
            />
          )}
          {activePage === "Settings" && (
            <Settings
              agentEnabled={agentEnabled}
              onToggle={() => setAgentEnabled((value) => !value)}
            />
          )}
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-[#e8e9e3] bg-[#fdfdfb] px-2 py-2 md:hidden">
        {[...mainNav, { label: "Settings", icon: Settings2 }].map(
          ({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => setActivePage(label)}
              className={`flex flex-col items-center gap-1 py-1.5 text-[9px] ${
                activePage === label
                  ? "font-semibold text-[#527b62]"
                  : "text-[#888c83]"
              }`}
            >
              <Icon size={18} strokeWidth={activePage === label ? 2.2 : 1.7} />
              {label}
            </button>
          ),
        )}
      </nav>

      {selectedCall && (
        <CallDetails call={selectedCall} onClose={() => setSelectedCall(null)} />
      )}
    </main>
  );
}

function Overview({
  agentEnabled,
  onToggle,
  onViewConversations,
  onSelectCall,
  visibleCalls,
  callFilter,
  onFilterChange,
  query,
  onQueryChange,
}: {
  agentEnabled: boolean;
  onToggle: () => void;
  onViewConversations: () => void;
  onSelectCall: (call: Call) => void;
  visibleCalls: Call[];
  callFilter: string;
  onFilterChange: (value: string) => void;
  query: string;
  onQueryChange: (value: string) => void;
}) {
  return (
    <>
      <div className="mb-8 flex flex-col justify-between gap-5 sm:mb-9 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-[#8b9086]">
            <CalendarDays size={13} />
            Wednesday, October 14
          </div>
          <h1 className="font-display m-0 text-[27px] font-bold leading-tight tracking-[-1.2px] text-[#2a302a] sm:text-[32px]">
            Your calls, handled.
          </h1>
          <p className="mb-0 mt-2 text-[13px] text-[#868b81]">
            Here&apos;s what&apos;s happening while you get on with your day.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-[#e6e8e1] bg-white px-3.5 py-2.5 soft-shadow">
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              agentEnabled ? "bg-[#e9f0e8] text-[#5f8064]" : "bg-[#f0f0ed] text-[#979a91]"
            }`}
          >
            <Headphones size={16} />
          </span>
          <span className="mr-1">
            <span className="block text-[11px] font-semibold text-[#454b42]">
              {agentEnabled ? "Taking your calls" : "Calls go to voicemail"}
            </span>
            <span className="mt-0.5 block text-[10px] text-[#999d94]">
              {agentEnabled ? "When you can’t pick up" : "Assistant paused"}
            </span>
          </span>
          <button
            onClick={onToggle}
            role="switch"
            aria-checked={agentEnabled}
            aria-label="Turn call assistant on or off"
            className={`relative h-[21px] w-[38px] rounded-full transition-colors ${
              agentEnabled ? "bg-[#64876a]" : "bg-[#cccec7]"
            }`}
          >
            <span
              className={`absolute top-[3px] h-[15px] w-[15px] rounded-full bg-white shadow-sm transition-all ${
                agentEnabled ? "left-[20px]" : "left-[3px]"
              }`}
            />
          </button>
        </div>
      </div>

      <div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={<PhoneCall size={16} />}
          label="Calls handled"
          value="24"
          note="↑ 6 from last week"
          tone="green"
        />
        <StatCard
          icon={<Mic2 size={16} />}
          label="Messages captured"
          value="18"
          note="Across 4 conversations"
          tone="lavender"
        />
        <StatCard
          icon={<Clock3 size={16} />}
          label="Time saved"
          value="1h 42m"
          note="You stayed in the flow"
          tone="peach"
        />
        <StatCard
          icon={<CheckCheck size={16} />}
          label="Callbacks to make"
          value="3"
          note="One needs a reply today"
          tone="sand"
        />
      </div>

      <div className="mb-7 grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
        <section className="relative min-h-[185px] overflow-hidden rounded-[18px] bg-[#3f644a] p-6 text-white sm:p-7">
          <div className="pointer-events-none absolute -right-2 -top-20 h-[270px] w-[270px] rounded-full border border-white/[0.09]" />
          <div className="pointer-events-none absolute -right-[-54px] -top-8 h-[200px] w-[200px] rounded-full border border-white/[0.09]" />
          <div className="pointer-events-none absolute -bottom-[132px] right-[100px] h-[220px] w-[220px] rounded-full border border-white/[0.09]" />
          <div className="relative z-[1] flex h-full flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div className="max-w-[460px]">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
                  <Sparkles size={14} className="text-[#d4e1ce]" />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#d1decf]">
                  Your daily brief
                </span>
              </div>
              <p className="font-display m-0 text-[20px] font-semibold leading-[1.45] tracking-[-0.55px] text-white sm:text-[22px]">
                You got your morning back.
              </p>
              <p className="mb-0 mt-2 max-w-[420px] text-[12px] leading-[1.7] text-[#e1e9de]/80">
                4 calls taken care of so far. Dr. Patel confirmed Thursday at 2:30, and Maya wants to make dinner plans.
              </p>
            </div>
            <button
              onClick={onViewConversations}
              className="flex w-fit shrink-0 items-center gap-2 rounded-lg bg-white/[0.12] px-3.5 py-2.5 text-[11px] font-medium text-white transition hover:bg-white/[0.2]"
            >
              See your calls <ArrowRight size={13} />
            </button>
          </div>
        </section>

        <section className="flex flex-col justify-between rounded-[18px] border border-[#e8e9e3] bg-white p-5 sm:p-6">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[12px] font-semibold text-[#3d443b]">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f0f2ed] text-[#697963]">
                  <Stars size={15} />
                </span>
                Your assistant
              </div>
              <span
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${
                  agentEnabled
                    ? "bg-[#edf4ed] text-[#608065]"
                    : "bg-[#f1f1ed] text-[#85897f]"
                }`}
              >
                {agentEnabled && <span className="status-pulse h-1.5 w-1.5 rounded-full bg-[#6f9a74]" />}
                {agentEnabled ? "Active" : "Paused"}
              </span>
            </div>
            <p className="mb-0 mt-4 text-[18px] font-semibold tracking-[-0.5px] text-[#363d35]">
              {agentEnabled ? "Ready when you need it." : "Taking a little break."}
            </p>
            <p className="mb-0 mt-1.5 text-[11px] leading-5 text-[#91958c]">
              {agentEnabled
                ? "Relay answers when you’re busy, unavailable, or just can’t get to your phone."
                : "Turn your assistant back on whenever you're ready."}
            </p>
          </div>
          <div className="mt-5 flex items-center gap-2 border-t border-[#f0f0ec] pt-4 text-[10px] text-[#90948b]">
            <ShieldCheck size={13} className="text-[#759078]" />
            Your availability comes first
            <button
              onClick={onToggle}
              className="ml-auto text-[10px] font-semibold text-[#52765b] hover:underline"
            >
              {agentEnabled ? "Pause assistant" : "Turn on"}
            </button>
          </div>
        </section>
      </div>

      <section>
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-display m-0 text-[17px] font-bold tracking-[-0.5px] text-[#333a33]">
              Recent conversations
            </h2>
            <p className="mb-0 mt-1 text-[11px] text-[#92968d]">
              Every call, thoughtfully summarized.
            </p>
          </div>
          <button
            onClick={onViewConversations}
            className="flex w-fit items-center gap-1.5 text-[11px] font-semibold text-[#5d7a61] hover:text-[#3f6348]"
          >
            All conversations <ArrowRight size={13} />
          </button>
        </div>
        <CallList
          calls={visibleCalls.slice(0, 3)}
          query={query}
          onQueryChange={onQueryChange}
          callFilter={callFilter}
          onFilterChange={onFilterChange}
          onSelectCall={onSelectCall}
        />
      </section>
    </>
  );
}

function StatCard({
  icon,
  label,
  value,
  note,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
  tone: string;
}) {
  const tones: Record<string, string> = {
    green: "bg-[#edf3eb] text-[#65816a]",
    lavender: "bg-[#f0edf6] text-[#817399]",
    peach: "bg-[#f6eee9] text-[#a17c65]",
    sand: "bg-[#f3f0e7] text-[#99895e]",
  };

  return (
    <div className="rounded-[15px] border border-[#e8e9e3] bg-white p-4 sm:p-[18px]">
      <div className="flex items-center gap-2">
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${tones[tone]}`}>
          {icon}
        </span>
        <span className="text-[10px] font-medium text-[#878b83] sm:text-[11px]">
          {label}
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-1">
        <span className="font-display text-[24px] font-bold leading-none tracking-[-0.8px] text-[#363c34] sm:text-[27px]">
          {value}
        </span>
        {tone === "green" && (
          <span className="mb-0.5 flex items-center text-[9px] font-medium text-[#729179]">
            <ArrowUpRight size={12} />
          </span>
        )}
      </div>
      <p className="mb-0 mt-2 text-[9px] text-[#9a9d95] sm:text-[10px]">{note}</p>
    </div>
  );
}

function Conversations({
  visibleCalls,
  callFilter,
  onFilterChange,
  query,
  onQueryChange,
  onSelectCall,
}: {
  visibleCalls: Call[];
  callFilter: string;
  onFilterChange: (value: string) => void;
  query: string;
  onQueryChange: (value: string) => void;
  onSelectCall: (call: Call) => void;
}) {
  return (
    <>
      <PageHeading
        eyebrow="YOUR INBOX"
        title="Conversations"
        description="A little context goes a long way. Here’s everything your assistant picked up."
      />
      <CallList
        calls={visibleCalls}
        query={query}
        onQueryChange={onQueryChange}
        callFilter={callFilter}
        onFilterChange={onFilterChange}
        onSelectCall={onSelectCall}
      />
    </>
  );
}

function CallList({
  calls,
  query,
  onQueryChange,
  callFilter,
  onFilterChange,
  onSelectCall,
}: {
  calls: Call[];
  query: string;
  onQueryChange: (value: string) => void;
  callFilter: string;
  onFilterChange: (value: string) => void;
  onSelectCall: (call: Call) => void;
}) {
  return (
    <div className="overflow-hidden rounded-[16px] border border-[#e8e9e3] bg-white">
      <div className="flex flex-col justify-between gap-3 border-b border-[#edeee9] px-4 py-3.5 sm:flex-row sm:items-center sm:px-5">
        <div className="flex flex-wrap items-center gap-1">
          {["All calls", "Messages", "Callbacks", "Spam"].map((filter) => (
            <button
              key={filter}
              onClick={() => onFilterChange(filter)}
              className={`rounded-full px-3 py-1.5 text-[10px] font-medium transition ${
                callFilter === filter
                  ? "bg-[#edf2eb] text-[#55745b]"
                  : "text-[#898d84] hover:bg-[#f6f7f3]"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
        <label className="flex h-[34px] items-center gap-2 rounded-lg border border-[#e9eae5] bg-[#fdfdfb] px-2.5 sm:w-[195px]">
          <Search size={14} className="shrink-0 text-[#a0a39b]" />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Find a call..."
            className="w-full bg-transparent text-[11px] text-[#53584f] outline-none placeholder:text-[#aaada6]"
          />
        </label>
      </div>
      {calls.length ? (
        <div>
          {calls.map((call, index) => (
            <button
              key={call.id}
              onClick={() => onSelectCall(call)}
              className={`group flex w-full items-start gap-3 px-4 py-4 text-left transition hover:bg-[#fbfcf9] sm:items-center sm:gap-4 sm:px-5 ${
                index !== calls.length - 1 ? "border-b border-[#f0f1ec]" : ""
              }`}
            >
              <span
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold sm:mt-0 ${initialsStyle[call.color]}`}
              >
                {call.initials}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-[12px] font-semibold text-[#464b43]">
                    {call.name}
                  </span>
                  {call.label && (
                    <span className="rounded bg-[#f3f4f0] px-1.5 py-0.5 text-[9px] text-[#858a80]">
                      {call.label}
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${
                      call.status === "Callback requested"
                        ? "bg-[#f7f0e5] text-[#9b7e4f]"
                        : call.status === "Spam filtered"
                          ? "bg-[#f3f2ee] text-[#93968e]"
                          : "bg-[#edf3ec] text-[#68836b]"
                    }`}
                  >
                    {call.status}
                  </span>
                </span>
                <span className="mt-1 block truncate text-[11px] leading-[1.55] text-[#858a80]">
                  {call.summary}
                </span>
                <span className="mt-1 flex items-center gap-1.5 text-[9px] text-[#a0a39a] sm:hidden">
                  {call.time} <span>·</span> {call.duration}
                </span>
              </span>
              <span className="hidden w-[65px] shrink-0 text-right text-[10px] text-[#8e9289] sm:block">
                {call.time}
              </span>
              <span className="hidden w-[50px] shrink-0 text-right text-[10px] text-[#a0a39a] sm:block">
                {call.duration}
              </span>
              <span className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#9ca097] group-hover:bg-[#f1f3ee] group-hover:text-[#66806a] sm:flex">
                <ChevronRight size={15} />
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center px-5 py-12 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3f4f0] text-[#8c9188]">
            <Phone size={17} />
          </span>
          <p className="mb-0 mt-3 text-[12px] font-semibold text-[#4d534a]">
            No calls found
          </p>
          <p className="mb-0 mt-1 text-[11px] text-[#92968d]">
            Try a different search or choose another filter.
          </p>
        </div>
      )}
      <div className="flex items-center justify-between border-t border-[#edeee9] px-4 py-3 sm:px-5">
        <span className="text-[10px] text-[#999d94]">
          Showing {calls.length} {calls.length === 1 ? "conversation" : "conversations"}
        </span>
        <button
          onClick={() => onFilterChange("All calls")}
          className="flex items-center gap-1.5 text-[10px] font-medium text-[#72776e] hover:text-[#4e7255]"
        >
          <ListFilter size={12} />
          Reset filters
        </button>
      </div>
    </div>
  );
}

function Contacts({ added, onAdd }: { added: boolean; onAdd: () => void }) {
  const contacts = [
    { name: "Maya Chen", number: "(415) 555-0182", initials: "MC", color: "sage" },
    { name: "Dr. Patel's Office", number: "(415) 555-0136", initials: "DP", color: "lavender" },
    { name: "Alex Rivera", number: "(510) 555-0114", initials: "AR", color: "peach" },
    ...(added
      ? [{ name: "Sam Taylor", number: "(415) 555-0147", initials: "ST", color: "sand" }]
      : []),
  ];

  return (
    <>
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <PageHeading
          eyebrow="PEOPLE YOU KNOW"
          title="Contacts"
          description="A familiar voice deserves a familiar hello."
        />
        <button
          onClick={onAdd}
          className="flex h-9 w-fit items-center gap-2 rounded-lg bg-[#476d52] px-3.5 text-[11px] font-medium text-white transition hover:bg-[#3d6048]"
        >
          {added ? <Check size={14} /> : <Plus size={14} />}
          {added ? "Sample contact added" : "Add a contact"}
        </button>
      </div>
      <div className="overflow-hidden rounded-[16px] border border-[#e8e9e3] bg-white">
        <div className="flex items-center gap-3 border-b border-[#edeee9] px-5 py-4">
          <BookUser size={16} className="text-[#70836e]" />
          <span className="text-[12px] font-semibold text-[#434940]">
            Your people
          </span>
          <span className="ml-auto text-[10px] text-[#9a9d95]">
            {contacts.length} contacts
          </span>
        </div>
        {contacts.map((contact, index) => (
          <div
            key={contact.name}
            className={`flex items-center gap-3 px-5 py-4 ${
              index < contacts.length - 1 ? "border-b border-[#f0f1ec]" : ""
            }`}
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full text-[10px] font-semibold ${initialsStyle[contact.color]}`}
            >
              {contact.initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[12px] font-semibold text-[#464b43]">
                {contact.name}
              </span>
              <span className="mt-0.5 block text-[10px] text-[#91958c]">
                {contact.number}
              </span>
            </span>
            <span className="hidden rounded-full bg-[#edf3ec] px-2.5 py-1 text-[9px] font-medium text-[#68836b] sm:block">
              Recognized
            </span>
            <button className="flex h-8 w-8 items-center justify-center rounded-full text-[#9a9d95] hover:bg-[#f4f5f1]" aria-label={`Options for ${contact.name}`}>
              <MoreHorizontal size={17} />
            </button>
          </div>
        ))}
        <div className="flex items-center gap-2 border-t border-[#edeee9] bg-[#fdfdfb] px-5 py-3 text-[10px] text-[#93978e]">
          <UserRound size={13} />
          Contacts shown are sample data. Connect your contacts to keep things personal.
        </div>
      </div>
    </>
  );
}

function Settings({
  agentEnabled,
  onToggle,
}: {
  agentEnabled: boolean;
  onToggle: () => void;
}) {
  const [voicemail, setVoicemail] = useState(true);
  const [transcripts, setTranscripts] = useState(true);

  return (
    <>
      <PageHeading
        eyebrow="MAKE IT YOURS"
        title="Settings"
        description="Your assistant, your boundaries. Change things whenever you like."
      />
      <div className="max-w-[740px] space-y-4">
        <SettingsGroup title="Call handling" icon={<Phone size={15} />}>
          <SettingRow
            title="Answer calls for me"
            description="Relay steps in when you’re busy, unavailable, or don’t answer."
            enabled={agentEnabled}
            onToggle={onToggle}
          />
          <SettingRow
            title="Take a message"
            description="Capture what callers need and summarize it for you."
            enabled={voicemail}
            onToggle={() => setVoicemail((value) => !value)}
          />
        </SettingsGroup>
        <SettingsGroup title="Privacy & data" icon={<ShieldCheck size={15} />}>
          <SettingRow
            title="Save call transcripts"
            description="Keep a searchable text record of conversations handled by Relay."
            enabled={transcripts}
            onToggle={() => setTranscripts((value) => !value)}
          />
          <div className="flex items-center gap-3 px-5 py-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f4f3ef] text-[#8b8878]">
              <CircleHelp size={15} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-semibold text-[#4c524a]">
                Your privacy matters
              </span>
              <span className="mt-1 block text-[10px] leading-4 text-[#92968d]">
                Callers are informed when the assistant answers. You control what gets saved.
              </span>
            </span>
            <ChevronRight size={15} className="text-[#a0a39b]" />
          </div>
        </SettingsGroup>
        <SettingsGroup title="Your availability" icon={<Clock3 size={15} />}>
          <div className="flex items-center gap-3 px-5 py-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0f2ed] text-[#788372]">
              <CalendarDays size={15} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-semibold text-[#4c524a]">
                Always available
              </span>
              <span className="mt-1 block text-[10px] text-[#92968d]">
                Your assistant picks up based on your call availability.
              </span>
            </span>
            <button className="flex items-center gap-1 text-[10px] font-medium text-[#638069]">
              Manage <ChevronDown size={12} />
            </button>
          </div>
        </SettingsGroup>
      </div>
    </>
  );
}

function SettingsGroup({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[15px] border border-[#e8e9e3] bg-white">
      <div className="flex items-center gap-2 border-b border-[#edeee9] px-5 py-3.5 text-[11px] font-semibold text-[#53594f]">
        <span className="text-[#798a75]">{icon}</span>
        {title}
      </div>
      {children}
    </section>
  );
}

function SettingRow({
  title,
  description,
  enabled,
  onToggle,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-[#f0f1ec] px-5 py-4 last:border-0">
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold text-[#4c524a]">{title}</span>
        <span className="mt-1 block text-[10px] leading-4 text-[#92968d]">
          {description}
        </span>
      </span>
      <button
        onClick={onToggle}
        role="switch"
        aria-checked={enabled}
        aria-label={title}
        className={`relative h-[21px] w-[38px] shrink-0 rounded-full transition-colors ${
          enabled ? "bg-[#64876a]" : "bg-[#cccec7]"
        }`}
      >
        <span
          className={`absolute top-[3px] h-[15px] w-[15px] rounded-full bg-white shadow-sm transition-all ${
            enabled ? "left-[20px]" : "left-[3px]"
          }`}
        />
      </button>
    </div>
  );
}

function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-7">
      <p className="mb-2 text-[10px] font-semibold tracking-[0.14em] text-[#92978d]">
        {eyebrow}
      </p>
      <h1 className="font-display m-0 text-[28px] font-bold tracking-[-1px] text-[#2a302a] sm:text-[32px]">
        {title}
      </h1>
      <p className="mb-0 mt-2 text-[12px] leading-5 text-[#898e84]">
        {description}
      </p>
    </div>
  );
}

function CallDetails({ call, onClose }: { call: Call; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-[#22291f]/30 p-0 backdrop-blur-[2px] sm:items-center sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="call-detail-title"
        className="max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-t-[20px] border border-[#e7e9e1] bg-[#fdfdfb] p-5 shadow-2xl sm:rounded-[20px] sm:p-6"
      >
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full text-[11px] font-semibold ${initialsStyle[call.color]}`}
            >
              {call.initials}
            </span>
            <span>
              <h2
                id="call-detail-title"
                className="m-0 text-[14px] font-semibold text-[#41473f]"
              >
                {call.name}
              </h2>
              <span className="mt-1 block text-[10px] text-[#92968d]">
                {call.phone} <span className="mx-1">·</span> {call.time}
              </span>
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close conversation details"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#81867d] hover:bg-[#f0f1ec]"
          >
            <X size={16} />
          </button>
        </div>
        <div className="mb-4 flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[9px] font-medium ${
              call.status === "Callback requested"
                ? "bg-[#f7f0e5] text-[#9b7e4f]"
                : call.status === "Spam filtered"
                  ? "bg-[#f3f2ee] text-[#93968e]"
                  : "bg-[#edf3ec] text-[#68836b]"
            }`}
          >
            {call.status}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-[#999d94]">
            <Clock3 size={12} /> {call.duration}
          </span>
        </div>
        <div className="rounded-xl border border-[#e9eae5] bg-white p-4">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold text-[#667c66]">
            <Sparkles size={13} />
            Call summary
          </div>
          <p className="m-0 text-[12px] leading-[1.7] text-[#656b61]">{call.summary}</p>
        </div>
        <div className="mt-4">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold text-[#74796f]">
            <AudioLines size={13} />
            Transcript
          </div>
          <p className="m-0 rounded-xl bg-[#f5f6f2] px-4 py-3.5 text-[11px] leading-[1.8] text-[#72776e]">
            “{call.transcript}”
          </p>
        </div>
        <div className="mt-5 flex gap-2 border-t border-[#edeee9] pt-4">
          <button
            onClick={onClose}
            className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-[#476d52] text-[11px] font-medium text-white hover:bg-[#3d6048]"
          >
            <Phone size={13} /> Call back
          </button>
          <button
            onClick={onClose}
            className="flex h-9 items-center justify-center gap-2 rounded-lg border border-[#e7e9e1] px-4 text-[11px] font-medium text-[#676d63] hover:bg-[#f7f8f4]"
          >
            <ArrowDownLeft size={13} /> Mark as done
          </button>
        </div>
      </section>
    </div>
  );
}
