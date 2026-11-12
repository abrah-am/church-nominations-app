import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'

interface VoterStateLinkProps {
  href: string
  children: ReactNode
  current?: boolean
  disabled?: boolean
  onLocalNavigate: (() => void) | undefined
}

/** Route links when composed by the wrapper; in-memory navigation otherwise. */
export function VoterStateLink({ href, children, current, disabled, onLocalNavigate }: VoterStateLinkProps) {
  const className = buttonVariants({
    variant: current ? 'default' : 'outline',
    className: 'h-auto min-h-11 max-w-full whitespace-normal px-3 py-2 aria-disabled:opacity-50',
  })

  if (disabled) {
    return (
      <a
        role="link"
        aria-current={current ? 'page' : undefined}
        aria-disabled="true"
        tabIndex={-1}
        className={className}
        onClick={(event) => event.preventDefault()}
      >
        {children}
      </a>
    )
  }

  if (onLocalNavigate) {
    return (
      <a
        href={href}
        aria-current={current ? 'page' : undefined}
        className={className}
        onClick={(event) => {
          event.preventDefault()
          onLocalNavigate()
        }}
      >
        {children}
      </a>
    )
  }

  return (
    <Link
      to={href}
      aria-current={current ? 'page' : undefined}
      className={className}
    >
      {children}
    </Link>
  )
}
