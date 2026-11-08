export function AgentAvatar({
  team,
  size = 92,
  thinking = false,
}: {
  team: "spark" | "anchor" | "moderator";
  size?: number;
  thinking?: boolean;
}) {
  if (team === "moderator")
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        aria-hidden="true"
      >
        <rect x="9" y="9" width="82" height="82" rx="28" fill="#d9ef76" />
        <rect x="25" y="30" width="50" height="38" rx="15" fill="#28352b" />
        <circle cx="39" cy="46" r="4" fill="#d9ef76" />
        <circle cx="61" cy="46" r="4" fill="#d9ef76" />
        <path
          d="M43 57h14"
          stroke="#d9ef76"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M50 11V3M44 3h12"
          stroke="#28352b"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    );
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      aria-hidden="true"
      className={thinking ? "avatar-thinking" : ""}
    >
      {team === "spark" ? (
        <>
          <ellipse
            cx="80"
            cy="144"
            rx="44"
            ry="8"
            fill="#172d99"
            opacity=".12"
          />
          <path
            d="m79 7 17 25 29-4 3 29 25 17-20 23 4 29-30 5-20 23-21-21-31 1-2-30L11 84l22-22-1-30 30-2z"
            fill="#3158ed"
            stroke="#1935b1"
            strokeWidth="3"
          />
          <path
            d="m78 18 14 24 27-5"
            stroke="#7190ff"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <rect x="44" y="58" width="73" height="46" rx="21" fill="#fff" />
          <rect x="59" y="69" width="9" height="18" rx="4.5" fill="#18214b" />
          <rect x="91" y="69" width="9" height="18" rx="4.5" fill="#18214b" />
          <path
            d="M71 94q9 7 18 0"
            stroke="#18214b"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="m39 111-13 10m94-10 13 10"
            stroke="#1935b1"
            strokeWidth="7"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <ellipse
            cx="80"
            cy="144"
            rx="44"
            ry="8"
            fill="#4d347c"
            opacity=".12"
          />
          <path
            d="M46 25h69q18 0 18 20v68q0 20-21 20H48q-21 0-21-21V47q0-22 19-22Z"
            fill="#b6a0ee"
            stroke="#7454b8"
            strokeWidth="3"
          />
          <path
            d="M42 47q0-9 9-9h51"
            stroke="#d8c8ff"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="m50 25 6-15h45l7 15"
            fill="#b6a0ee"
            stroke="#7454b8"
            strokeWidth="3"
          />
          <rect x="44" y="58" width="72" height="45" rx="14" fill="#fff" />
          <path
            d="M55 70h17m16 0h17"
            stroke="#3f315e"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <rect x="61" y="73" width="7" height="13" rx="3.5" fill="#3f315e" />
          <rect x="92" y="73" width="7" height="13" rx="3.5" fill="#3f315e" />
          <path
            d="M73 94h16"
            stroke="#3f315e"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M26 98 15 112m119-14 11 14"
            stroke="#7454b8"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M56 133v11m49-11v11"
            stroke="#7454b8"
            strokeWidth="8"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}
