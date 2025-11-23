import React, { useMemo, useState } from "react";

type Comment = {
  id: number;
  user: string;
  avatar?: string;
  comment: string;
  time: string;
};

const COMMENTS: Comment[] = [
  { id: 1, user: "Manish Jangir", comment: "Updated the Jira ticket and added new details.", time: "2 hours ago", avatar: "/images/user/user-01.jpg" },
  { id: 2, user: "Anurag Vaidya", comment: "The UI issue is fixed. Please verify once.", time: "5 hours ago", avatar: "/images/user/user-01.jpg" },
  { id: 3, user: "Harsh", comment: "Started working on the API integration task.", time: "Yesterday", avatar: "/images/user/user-01.jpg" },
  { id: 4, user: "Tejas", comment: "Updated documentation for latest release.", time: "2 days ago", avatar: "/images/user/user-01.jpg" },
  { id: 5, user: "Prajwal", comment: "Approved the Final Quotation.", time: "2 days ago", avatar: "/images/user/user-01.jpg" },
];

export default function RecentComments({ compact = false }: { compact?: boolean }) {
  const [query, setQuery] = useState("");

  const cardPadding = compact ? "p-3" : "p-5";
  const avatarSize = compact ? "w-8 h-8" : "w-10 h-10";
  const textSize = compact ? "text-sm" : "text-base";

  // search filter → matches user OR comment text
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMENTS;
    return COMMENTS.filter(
      (c) =>
        c.user.toLowerCase().includes(q) ||
        c.comment.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className={`rounded-2xl border border-gray-200 bg-white ${cardPadding} dark:border-gray-800 dark:bg-white/[0.03]`}>
      {/* HEADER + SEARCH */}
     <div className="mb-3 flex items-center gap-40">
  <div>
    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
      Recent Comments
    </h3>
    <p className="text-xs text-gray-500 dark:text-gray-400">Activity from your team</p>
  </div>

  <input
    value={query}
    onChange={(e) => setQuery(e.target.value)}
    placeholder="Search by Name..."
  className="rounded-xl border border-gray-700 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition dark:border-gray-500 dark:bg-gray-900 dark:text-white"

  />
</div>


      {/* COMMENT LIST */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-sm text-gray-500 py-4">No comments found.</div>
        ) : (
          filtered.map((c) => (
            <div key={c.id} className="flex items-start gap-3 border-b border-gray-100 pb-3 last:border-none dark:border-gray-800">
              <div className={`${avatarSize} rounded-full overflow-hidden bg-gray-200 flex-shrink-0`}>
                {c.avatar ? (
                  <img
                    src={c.avatar}
                    alt={c.user}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none"; // hide broken img safely
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm">
                    {c.user.charAt(0)}
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className={`font-medium text-gray-800 dark:text-white/90 ${textSize}`}>{c.user}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{c.comment}</div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{c.time}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}