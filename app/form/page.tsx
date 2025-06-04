import { MemberForm } from '@/components/member-form';

export default function MemberRegistrationPage() {
  return (
    <div className="container mx-auto max-w-3xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Gym Membership Registration</h1>
        <p className="text-muted-foreground">
          Please fill out the form below to register as a gym member.
        </p>
      </div>
      <div className="bg-card p-6 rounded-lg shadow-sm border">
        <MemberForm />
      </div>
    </div>
  );
}