import { IMAGE_BASE_URL } from "@/constants";

type Card1Props = {
  handleNewUser: (id: number) => void;
  imageUrl: string | null;
  id: number;
  firstName: string;
  lastName: string;
  gender: string;
  email: string;
  mobileNo: string;
};

export default function Card1({
  handleNewUser,
  imageUrl,
  id,
  firstName,
  lastName,
  gender,
  email,
  mobileNo,
}: Readonly<Card1Props>) {
  return (
    <button
      key={id}
      onClick={() => handleNewUser(id)}
      className="flex gap-[0.75rem] p-[0.75rem] bg-surface-container-low min-w-[20rem] rounded-[0.75rem] cursor-pointer hover:bg-surface-container transition-colors border border-outline-variant"
    >
      <div>
        <img
          src={`${IMAGE_BASE_URL}${imageUrl}`}
          alt="User"
          height={60}
          width={60}
          className="rounded-full h-[3.75rem] w-[3.75rem]"
        />
      </div>
      <div className="text-start">
        <div className="pb-[0.5rem] space-y-[2px] mt-[2px]">
          <p>
            <span className="font-[700] text-[1rem] text-on-surface">
              {firstName}
            </span>
            <br />
            <span className="font-[700] text-[1rem] text-on-surface">
              {lastName},{" "}
            </span>
            <span className="font-[700] text-[1rem] text-on-surface-variant capitalize">
              {gender.charAt(0)}
            </span>
          </p>
          <p className="text-on-surface-variant">Role</p>
        </div>
        <div className="mt-[0.75rem] space-y-[2px]">
          <p className="text-on-surface-variant">{mobileNo}</p>
          <p className="text-on-surface-variant">Japan</p>
        </div>
        <p className="mt-[1rem] text-primary">{email}</p>
      </div>
    </button>
  );
}
