import { UserIcon } from '@heroicons/react/24/outline'

interface ChildCardProps {
    name: string;
    age?: number; // Optional as we strictly store grade? Let's assume we might infer or store basic info
    email?: string;
}

export function ChildCard({ name, email }: ChildCardProps) {
    return (
        <div className="flex items-center space-x-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                <UserIcon className="h-6 w-6" />
            </div>
            <div>
                <h3 className="text-lg font-medium text-gray-900">{name}</h3>
                {email && <p className="text-sm text-gray-500">{email}</p>}
            </div>
        </div>
    )
}
