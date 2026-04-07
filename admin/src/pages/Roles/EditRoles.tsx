import {
  useGetRoleByIdQuery,
  useListAllRolesQuery,
  useUpdateRoleMutation,
} from "@/redux/services/role";
import { useEffect, useState } from "react";
import { handleError, handleResponse } from "@/utils/responseHandler";
import Button from "@/components/Button";
import { MdOutlineFactCheck } from "react-icons/md";
import useTranslation from "@/locale/useTranslation";

type ResponseItem = {
  list: string;
  id: number;
  title: string;
};

type GroupedItem = {
  id: number;
  title: string;
  children: Array<{ title: string; id: number }>;
};

function GetRolesAndAccess(response: ResponseItem[]): GroupedItem[] {
  const grouped = response.reduce((acc: Record<string, GroupedItem>, each) => {
    if (!acc[each.list]) {
      acc[each.list] = {
        id: each.id,
        title: each.list,
        children: [],
      };
    }
    acc[each.list].children.push({
      title: each.title,
      id: each.id,
    });
    return acc;
  }, {});

  return Object.values(grouped);
}

export default function EditRoles({
  id,
  setIsOpen,
}: {
  id: number | null;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const translate = useTranslation();

  const { data: roleMenuAction, isSuccess: success } = useListAllRolesQuery("");
  const { data: allowableRoles, isSuccess: allowableRolesSuccess } =
    useGetRoleByIdQuery(id, {
      skip: id === null,
    });
  const [updateRole] = useUpdateRoleMutation();
  const [accessRoles, setAccessRoles] = useState<number[]>([]);

  const handleCheckboxChange = (id: number) => {
    if (accessRoles.includes(id)) {
      const newAccessRoles = accessRoles.filter((each) => each !== id);
      setAccessRoles(newAccessRoles);
    } else {
      setAccessRoles([...accessRoles, id]);
    }
  };

  const handleSelectAll = (section: GroupedItem) => {
    const sectionIds = section.children.map((child) => child.id);
    const isAllSelected = sectionIds.every((id) => accessRoles.includes(id));

    if (isAllSelected) {
      // Unselect all
      setAccessRoles(accessRoles.filter((id) => !sectionIds.includes(id)));
    } else {
      // Select all
      const newAccessRoles = [...new Set([...accessRoles, ...sectionIds])];
      setAccessRoles(newAccessRoles);
    }
  };

  useEffect(() => {
    if (allowableRolesSuccess) {
      const allowedRoles = allowableRoles?.data?.role_actions.map(
        (each: { role_menu_action: { id: number } }) =>
          each.role_menu_action.id,
      );
      setAccessRoles(allowedRoles);
    }
  }, [id, allowableRoles, allowableRolesSuccess]);

  const data =
    success && roleMenuAction?.data?.data
      ? GetRolesAndAccess(roleMenuAction.data.data)
      : [];

  const handleCloseDrawer = () => {
    setIsOpen(false);
  };

  const handleSubmit = async () => {
    const body = {
      title: allowableRoles?.data?.title,
      description: allowableRoles?.data?.title,
      roleType: allowableRoles?.data?.roleType,
      role_actions: accessRoles.map((each) => ({
        roleMenuActionId: each,
      })),
    };
    try {
      const response = await updateRole({ body, id }).unwrap();
      handleResponse({
        res: response,
        onSuccess: handleCloseDrawer,
      });
    } catch (error) {
      handleError({ error });
    }
  };

  return (
    <div className="mt-[4rem]">
      <div className="flex mt-[4rem] mb-[1.5rem]">
        <p className="flex items-center gap-[6px] px-[20px] py-[8px] rounded-[0.25rem] bg-primaryColor text-white">
          <MdOutlineFactCheck />
          <p className="font-[500] text-[15px]">{translate("Edit Role")}</p>
        </p>
      </div>
      {data
        .filter((section) => section.title !== "Product Variant")
        .map((section, index) => (
          <div key={index}>
            <div className="flex flex-col gap-[1rem] items-start">
              <div className="flex items-center gap-[1rem]">
                <p className="font-bold text-[1rem] pt-3">{section.title}</p>
                <input
                  className="mt-3"
                  type="checkbox"
                  checked={section.children.every((child) =>
                    accessRoles.includes(child.id),
                  )}
                  onChange={() => handleSelectAll(section)}
                />
                <label className="font-bold text-[1rem] mt-3">Select All</label>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-[1rem] w-full">
                {section.children.map((item, index) => (
                  <div
                    key={index}
                    className="border py-[0.5rem] px-[20px] rounded-[6px] flex items-center gap-[2rem]"
                  >
                    <input
                      type="checkbox"
                      checked={accessRoles?.includes(item.id) ? true : false}
                      onChange={() => handleCheckboxChange(item.id)}
                    />
                    <p className="font-[400] text-[15px] ">{item.title}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      <br />
      <Button className="submit-button" handleClick={handleSubmit}>
        <div className="flex justify-center items-center gap-[0.5rem]">
          Submit
        </div>
      </Button>
    </div>
  );
}
