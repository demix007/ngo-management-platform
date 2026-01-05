import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/partners')({
  component: PartnersLayout,
})

function PartnersLayout() {
  return <Outlet />
}
