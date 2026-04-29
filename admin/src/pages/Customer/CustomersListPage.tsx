import { Link } from "react-router-dom";

export function CustomersListPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Customers</h1>
      <p className="mb-4">
        <Link to="/app/customers/search" className="text-blue-600 hover:underline">
          Search Customers
        </Link>{" "}
        to find and view customer details, vehicles, appointments, and purchase history.
      </p>
      <p className="text-gray-600">
        Use the search page to look up customers by ID, phone number, vehicle number, or name.
      </p>
    </div>
  );
}
