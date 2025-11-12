import { useEffect, useState } from "react";
import type { User } from "../types/user";

export default function BSokNay() {
  // const [posts, setPost] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const fetchUsers = async () => {
    const res = await fetch("https://jsonplaceholder.typicode.com/users");
    const data = await res.json();
    setUsers(data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div>
      <h1>Listing of users</h1>
      <ul>
        {users.map((data) => {
          return (
            <li key={data.id}>
              <strong>Name: </strong>
              {data.name}
              <br />
              <strong>Username: </strong>
              {data.username}
              <br />
              <strong>Email: </strong>
              {data.email}
              <div>
                <strong>Address: </strong>City:{data.address.city},
                {data.address.street},{data.address.zipcode}
              </div>

              <strong>Phone Number: </strong>
              {data.phone}
              <br />
              <strong>WebSite: </strong>
              {data.website}
              <br />

              <div>
                <strong>Company Information:</strong>
              </div>
              <strong>Name: </strong>
              {data.company.name}
              <br />
              <br />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
