import PageTitle from "@/components/PageTitle";
import { IMAGE_BASE_URL } from "@/constants";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { SetStateAction } from "react";
import userImage from "@/assets/user_image.jpeg";
import moment from "moment";
import { FaCircleCheck, FaCircleXmark } from "react-icons/fa6";
import Table from "@/components/Table";
import { buildQueryString } from "@/utils/generalHelper";
import usePagination from "@/hooks/usePagination";

type ViewCustomerProps = {
  id: number | null;
  isOpen: boolean;
  setIsOpen: React.Dispatch<SetStateAction<boolean>>;
};

export default function ViewCustomer({
  id,
  isOpen,
  setIsOpen,
}: ViewCustomerProps) {
  const { query, handlePagination } = usePagination({ limit: 5, page: 1 });

  const {
    data: customerData,
    isLoading: loading,
    isSuccess: success,
  } = useGetApiQuery(
    { url: `customer-auth/${id}` },
    {
      skip: id === null || id === undefined,
    },
  );

  const url = buildQueryString(`order/list`, {
    page: query.page,
    limit: query.limit,
    search: { customerId: id },
  });

  const {
    data: allOrders,
    isSuccess: orderSuccess,
    isLoading: orderLoading,
  } = useGetApiQuery({ url });

  const pagination = {
    page: allOrders?.data?.page ?? 1,
    limit: allOrders?.data?.limit ?? 10,
    total: allOrders?.data?.total ?? 0,
    totalPages: allOrders?.data?.totalPages ?? 0,
  };

  const orderDetails =
    (success &&
      allOrders?.data?.data &&
      allOrders?.data?.data.length > 0 &&
      allOrders?.data?.data.map(
        ({
          id,
          trackingNo,
          orderDate,
          paymentMethod,
          paymentStatus,
          totalAmount,
        }) => [
          trackingNo,
          id,
          moment(orderDate).format("MMM D, YY hh:mm"),
          paymentMethod,
          <div className="flex justify-center">
            <div className={changeClassNameByName(paymentStatus)}>
              {paymentStatus}
            </div>
          </div>,
          totalAmount,
        ],
      )) ??
    [];

  return (
    <div className="mt-[2rem] ">
      <PageTitle title="Customer Details" />
      {success && (
        <div>
          {/* Order summary */}
          <div className="text-start space-y-[0.5rem] mt-[2rem]">
            <p className="font-[700] text-[1.75rem]">
              # {customerData.data.id}
            </p>
            <div className="flex gap-[3rem] font-[400] text-[1rem]">
              <p>
                {" "}
                <span className="font-[600] text-[1.25rem]">Created:</span>{" "}
                {moment(customerData.data.createdAt).format(
                  "MMM DD, YYYY h:mm a",
                )}
              </p>
              <p>
                {" "}
                <span className="font-[600] text-[1.25rem]">Updated: </span>
                {moment(customerData.data.updatedAt).format(
                  "MMM DD, YYYY h:mm a",
                )}
              </p>
            </div>
            <div className="flex justify-start items-center gap-[1.5rem]">
              <span className="font-[600] text-[1.25rem]">
                Email Verified:{" "}
              </span>
              {customerData.data.isEmailVerified ? (
                <FaCircleCheck className="text-[#0090dd]" />
              ) : (
                <FaCircleXmark className="text-red-500" />
              )}
            </div>
          </div>
          {/* Customer Details */}
          <div className="bg-[#f0f3f4] w-fit flex flex-col items-start p-[1.25rem] mt-[2rem]">
            <h3 className="font-[700] text-[1.25rem] ">Customer Details</h3>
            <div className="flex gap-[2rem]">
              <div className="w-full font-[400] text-[1rem] mt-[1.5rem] space-y-[1rem]">
                <div className="flex justify-between w-[100%] gap-[2rem] ">
                  <div className="font-[600] text-[1.15rem]">Username:</div>{" "}
                  <div>{customerData.data.username}</div>
                </div>
                <div className="flex justify-between w-[100%] gap-[2rem] ">
                  <div className="font-[600] text-[1.15rem]">Email:</div>{" "}
                  <div>{customerData.data.email}</div>
                </div>
                <div className="flex justify-between w-[100%] gap-[2rem] ">
                  <div className="font-[600] text-[1.15rem]">Name:</div>{" "}
                  <div>
                    {customerData.data.firstName} {customerData.data.lastName}
                  </div>
                </div>
                <div className="flex justify-between w-[100%] gap-[2rem] ">
                  <div className="font-[600] text-[1.15rem]">
                    Mobile Number:
                  </div>{" "}
                  <div>
                    {customerData.data.mobilePrefix}{" "}
                    {customerData.data.mobileNo}
                  </div>
                </div>
                <div className="flex justify-between w-[100%] gap-[2rem] ">
                  <div className="font-[600] text-[1.15rem]">
                    Primary Address:
                  </div>{" "}
                  <div>{customerData.data.addressPrimary}</div>
                </div>
                <div className="flex justify-between w-[100%] gap-[2rem] ">
                  <div className="font-[600] text-[1.15rem]">
                    Secondary Address:
                  </div>{" "}
                  <div>{customerData.data.addressSecondary}</div>
                </div>
              </div>
              <div className="border h-[8rem] w-[8rem] rounded-[0.375rem]">
                <img
                  src={
                    customerData?.data?.imageUrl !== null
                      ? `${IMAGE_BASE_URL}${customerData?.data?.imageUrl}`
                      : userImage
                  }
                  alt="User"
                  className="object-cover h-[8rem] w-[8rem] overflow-hidden"
                  // crossOrigin="anonymous"
                />
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-[#f0f3f4] w-full flex flex-col items-start p-[1.25rem] mt-[2rem]">
            <h3 className="font-[700] text-[1.25rem] ">Order Summary</h3>
            <div className="w-full mt-[1rem]">
              <Table
                isSN
                headers={tableHeader}
                data={orderDetails}
                pagination={pagination}
                handlePagination={handlePagination}
              />
            </div>
          </div>

          {/* Personal Info */}
          {/* <div className="bg-[#f0f3f4] flex w-fit gap-[3rem]">
            <div className="border h-[6.25rem] w-[6.25rem] rounded-[0.375rem]">
              <img
                src={
                  customerData?.data?.imageUrl !== null
                    ? `${IMAGE_BASE_URL}${customerData?.data?.imageUrl}`
                    : userImage
                }
                alt="User"
                className="object-cover h-[6.25rem] w-[6.25rem] overflow-hidden"
                crossOrigin="anonymous"
              />
            </div>
            <div className="flex flex-col gap-[0.25rem]">
              <p>Name: {customerData?.data?.username}</p>
              <p>Email: {customerData?.data?.email}</p>
              <p>Gender: {customerData?.data?.gender}</p>
              <p>Phone Number: {customerData?.data?.mobileNo}</p>
            </div>
          </div> */}
          {/* Payment Methods */}
          {/* <div>
            <PageTitle title="Payment Methods" />
            <div className="border w-fit px-[0.75rem] py-[0.5rem]"></div>
          </div> */}
          {/* Order History */}
          {/* <div>
            <PageTitle title="Order History" />
          </div> */}
          {/* Actions */}
          {/* <div>
            <PageTitle title="Actions" />
          </div> */}
        </div>
      )}
    </div>
  );
}

const tableHeader = [
  "Tracking Number",
  "Order Id",
  "Order Date",
  "Payment Method",
  "Payment Status",
  "Total Amount",
];

const changeClassNameByName = (name: string) => {
  let normalClassName =
    "px-[0.75rem] py-[0.25rem] rounded-full w-fit text-white";
  if (name === "pending") {
    normalClassName += normalClassName.concat(" bg-yellow-500");
  } else if (name === "complete") {
    normalClassName += normalClassName.concat(" bg-blue-500");
  } else if (name === "delivered") {
    normalClassName += normalClassName.concat(" bg-green-500");
  } else if (name === "cancelled") {
    normalClassName += normalClassName.concat(" bg-red-500");
  } else {
    normalClassName;
  }
  return normalClassName;
};
