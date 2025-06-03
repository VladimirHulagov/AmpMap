interface GraphIconProps {
  isActive?: boolean
}

const ACTIVE_COLOR = "#425CD7"
const INACTIVE_COLOR = "rgba(119, 119, 119, 1)"

export const GraphIcon = ({ isActive = false }: GraphIconProps) => {
  const color = isActive ? ACTIVE_COLOR : INACTIVE_COLOR

  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" fill="var(--y-color-background)" />
      <path d="M7.25899 14.6651V1.33008H5.03674V14.6651H7.25899Z" fill={color} />
      <path d="M3.55523 14.6647V6.74707H1.33301V14.6647H3.55523Z" fill={color} />
      <path d="M10.9626 4.66406V14.6653H8.74036V4.66406H10.9626Z" fill={color} />
      <path d="M14.6663 14.6646V7.99707H12.4441V14.6646H14.6663Z" fill={color} />
    </svg>
  )
}
