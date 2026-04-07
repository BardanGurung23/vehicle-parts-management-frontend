import { MdEditSquare } from "react-icons/md";
import Table from "@/components/Table";
import { useListAccessModuleQuery } from "@/redux/services/role";
import moment from "moment";
import { useNavigate } from "react-router-dom";

export default function Access() {
  const navigate = useNavigate();
  const { data: accessModule, isSuccess: success } =
    useListAccessModuleQuery("");

  const handleAccessEdit = (id: number) => {
    navigate(`/admin/access/${id}`);
  };

  const tableData =
    success && accessModule?.data?.data
      ? accessModule.data.data.map(
          ({
            id,
            title,
            updatedAt,
          }: {
            id: number;
            title: string;
            updatedAt: string;
          }) => [
            title ? title : "",
            updatedAt ? moment(updatedAt).format("DD MMM, YYYY") : "",
            <div className="flex items-center justify-center gap-[0.5rem]">
              <MdEditSquare
                size={18}
                className="text-primaryColor cursor-pointer"
                onClick={() => handleAccessEdit(id)}
              />
            </div>,
          ],
        )
      : [];
  return (
    <div>
      <Table headers={tableHeaders} data={tableData} />
    </div>
  );
}

const tableHeaders = ["Module", "Is Active", "Actions"];
