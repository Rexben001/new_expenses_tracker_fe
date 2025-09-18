import { Link } from "react-router-dom";

export const AddNewItem = ({
  url,
  type,
  text,
  id,
}: {
  url: string;
  type: string;
  text: string;
  id?: string;
}) => {
  return (
    <section>
      <div className=" dark:text-white text-center text-sm text-gray-500 p-4 rounded-xl">
        {/* <p>You don’t have any budget for this month</p> */}
        <p>{text}</p>
        <button className="mt-2 text-blue-500">
          <Link to={url} state={{ id }}>
            + Add {type}
          </Link>
        </button>
      </div>
    </section>
  );
};
