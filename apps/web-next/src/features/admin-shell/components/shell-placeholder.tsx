interface ShellPlaceholderProps {
  title: string
}

export function ShellPlaceholder({ title }: ShellPlaceholderProps) {
  return (
    <section className="shell-placeholder">
      <h1>{title}</h1>
      <p>
        This destination is a shell-only placeholder. Its workflow is not
        implemented in this milestone.
      </p>
    </section>
  )
}
