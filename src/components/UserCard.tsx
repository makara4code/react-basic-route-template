import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import type { User } from "../types/user";

interface UserCardProps {
  user: User;
}

export function UserCard({ user }: UserCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-xl">{user.name}</CardTitle>
        <CardDescription>@{user.username}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium text-sm mb-1">Contact</h4>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <p className="text-sm text-muted-foreground">{user.phone}</p>
          <a
            href={`https://${user.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            {user.website}
          </a>
        </div>

        <div>
          <h4 className="font-medium text-sm mb-1">Address</h4>
          <p className="text-sm text-muted-foreground">
            {user.address.street}, {user.address.suite}
          </p>
          <p className="text-sm text-muted-foreground">
            {user.address.city}, {user.address.zipcode}
          </p>
        </div>

        <div>
          <h4 className="font-medium text-sm mb-1">Company</h4>
          <p className="text-sm font-medium">{user.company.name}</p>
          <p className="text-sm text-muted-foreground italic">"{user.company.catchPhrase}"</p>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1">
            View Profile
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            Message
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
