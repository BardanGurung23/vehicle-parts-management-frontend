import Input from "@/components/Input";
import TextArea from "@/components/TextArea";
import { CONTACT_URL } from "@/constants/apiUrlConstants";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { RiSeoLine } from "react-icons/ri";

export default function ViewContact({ id }: { id: number | null }) {
  const {
    data: contactData,
    isSuccess: success,
    isLoading: loading,
  } = useGetApiQuery(
    { url: `${CONTACT_URL}${id}` },
    {
      skip: id === null || id === undefined,
    },
  );

  return (
    <div>
      {/* Tab Section */}
      <div className="flex mt-[4rem] mb-[1.5rem]">
        <p className="flex items-center gap-[6px] px-[20px] py-[8px] rounded-[0.25rem] bg-primaryColor text-white">
          <RiSeoLine />
          <p className="font-[500] text-[15px]">Contact {id}</p>
        </p>
      </div>
      {loading ? (
        <>Loading </>
      ) : (
        <div className="flex gap-[1.5rem] mb-[2.5rem]">
          <form className="grid grid-cols-1 gap-[1.5rem] w-full">
            <Input
              label="Name"
              type="text"
              value={contactData?.data?.full_name}
              disabled
            />
            <Input
              label="Email"
              type="text"
              value={contactData?.data?.email}
              disabled
            />
            <Input
              label="Subject"
              type="text"
              value={contactData?.data?.subject}
              disabled
            />
            <TextArea
              label="Message"
              value={contactData?.data?.message}
              disabled
            />
          </form>
        </div>
      )}
    </div>
  );
}
