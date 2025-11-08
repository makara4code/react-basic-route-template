import axios from "axios";
import { useEffect, useState } from "react";

export default function BKumpheak() {
  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    const res = await axios.get("https://jsonplaceholder.typicode.com/users");
    const users = await res.data;
    setUsers(users);

    console.log(users);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div>
      <ol>
        {users.map((user) => {
          return (
            <li>
              <p>ID:{user.id}</p>
              <p>Name:{user.name}</p>
              <p>Username:{user.username}</p>
              <p>Email:{user.email}</p>
              <p>
                Address:{user.address.street},{user.address.suite},
                {user.address.city},{user.address.zipcode},
                {user.address.geo.lat},{user.address.geo.lng}
              </p>
              <p>Phone:{user.phone}</p>
              <p>Website:{user.website}</p>
              <p>
                Company:{user.company.name},{user.company.catchPhrase},
                {user.company.bs}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
