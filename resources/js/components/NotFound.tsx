import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

interface NotFoundProps {
    title: string;
    pathToCreate: string;
}
export default function NotFound({ title, pathToCreate }: NotFoundProps) {
    return (
        <div className="flex flex-col justify-center text-center">
            <img
                src="/assets/images/Illustration.png"
                alt=""
                width={300}
                height={300}
                className="mx-auto mb-[28px]"
            />
            <h1 className="mb-[11px] text-2xl font-semibold">
                No {title} found
            </h1>
            <p className="mb-[45px] text-sm text-gray-500">
                Start by creating a {title} now and gather valuable insights
                from your audience.
            </p>
            <Link href={pathToCreate}>
                <Button className="cursor-pointer">Create {title}</Button>
            </Link>
        </div>
    );
}
