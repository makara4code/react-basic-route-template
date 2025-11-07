const users = ["Jam Sbon", "Jane Doe", "Bob Smith"];
const products = ["Shirt", "Shoes", "Pants"];

export default function UserList() {
  return (
    <div>
      <h1>Statically Rendered</h1>
      <h1>John Doe</h1>
      <h1>Jane Doe</h1>
      <h1>Bob Smith</h1>
      <hr />
      <h1>Rendered with .map</h1>
      {users.map((name) => (
        <h1>{name}</h1>
      ))}
      {/* we use .map because react expect item to be render */}
      {products.map((product) => (
        <h2>Product Name: {product}</h2>
      ))}
      {/* forEach doesn't return anything */}
      {/* {products.forEach(() => )} */}
    </div>
  );
}
