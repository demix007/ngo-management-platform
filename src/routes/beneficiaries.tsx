import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/beneficiaries')({
  component: BeneficiariesLayout,
})

function BeneficiariesLayout() {
  return <Outlet />
}
