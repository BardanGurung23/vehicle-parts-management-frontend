import PageTitle from "@/components/PageTitle";
import { CurrencySign, IMAGE_BASE_URL } from "@/constants";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { SetStateAction } from "react";
import userImage from "@/assets/user_image.jpeg";
import moment from "moment";
import { FaCircleCheck, FaCircleXmark } from "react-icons/fa6";
import Table from "@/components/Table";
import TextArea from "@/components/TextArea";

type ViewCustomerProps = {
  id: number;
  isOpen: boolean;
  setIsOpen: React.Dispatch<SetStateAction<boolean>>;
};

export default function ViewCustomer({
  id,
  isOpen,
  setIsOpen,
}: ViewCustomerProps) {
  const {
    data: customerData,
    isLoading: loading,
    isSuccess: success,
  } = useGetApiQuery(
    { url: `order/${id}` },
    {
      skip: id === null || id === undefined,
    },
  );

  const orderDetails =
    (success &&
      customerData.data.orderItems &&
      customerData.data.orderItems.length > 0 &&
      customerData.data.orderItems.map(
        ({ id, quantity, price, discount, subtotal, product }) => [
          product ? product.name : "",
          quantity,
          `${CurrencySign} ${price}`,
          `${CurrencySign} ${discount}`,
          `${CurrencySign} ${subtotal}`,
        ],
      )) ??
    [];

  return (
    <div className="mt-[2rem] ">
      <PageTitle title="Order Details" />
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
              {customerData.data.customer.isEmailVerified ? (
                <FaCircleCheck className="text-[#0090dd]" />
              ) : (
                <FaCircleXmark className="text-red-500" />
              )}
            </div>
          </div>
          <div className="flex gap-[2rem]">
            {/* Customer Details */}
            <div className="bg-[#f0f3f4] w-fit flex flex-col items-start p-[1.25rem] mt-[2rem]">
              <h3 className="font-[700] text-[1.25rem] ">Customer Details</h3>
              <div className="flex gap-[2rem]">
                <div className="w-full font-[400] text-[1rem] mt-[1.5rem] space-y-[1rem]">
                  <div className="flex justify-between w-[100%] gap-[2rem] ">
                    <div className="font-[600] text-[1.15rem]">Username:</div>{" "}
                    <div>{customerData.data.customer.username}</div>
                  </div>
                  <div className="flex justify-between w-[100%] gap-[2rem] ">
                    <div className="font-[600] text-[1.15rem]">Email:</div>{" "}
                    <div>{customerData.data.customer.email}</div>
                  </div>
                  <div className="flex justify-between w-[100%] gap-[2rem] ">
                    <div className="font-[600] text-[1.15rem]">Name:</div>{" "}
                    <div>
                      {customerData.data.customer.firstName}{" "}
                      {customerData.data.customer.lastName}
                    </div>
                  </div>
                  <div className="flex justify-between w-[100%] gap-[2rem] ">
                    <div className="font-[600] text-[1.15rem]">
                      Mobile Number:
                    </div>{" "}
                    <div>
                      {customerData.data.customer.mobilePrefix}{" "}
                      {customerData.data.customer.mobileNo}
                    </div>
                  </div>
                  <div className="flex justify-between w-[100%] gap-[2rem] ">
                    <div className="font-[600] text-[1.15rem]">
                      Primary Address:
                    </div>{" "}
                    <div>{customerData.data.customer.addressPrimary}</div>
                  </div>
                  <div className="flex justify-between w-[100%] gap-[2rem] ">
                    <div className="font-[600] text-[1.15rem]">
                      Secondary Address:
                    </div>{" "}
                    <div>{customerData.data.customer.addressSecondary}</div>
                  </div>
                </div>
                <div className="border h-[8rem] w-[8rem] rounded-[0.375rem]">
                  <img
                    src={
                      customerData?.data?.customer?.imageUrl !== null
                        ? `${IMAGE_BASE_URL}${customerData?.data?.customer?.imageUrl}`
                        : userImage
                    }
                    alt="User"
                    className="object-cover h-[8rem] w-[8rem] overflow-hidden"
                    // crossOrigin="anonymous"
                  />
                </div>
              </div>
            </div>
            {/* Order Details */}
            <div className="bg-[#f0f3f4] w-full flex flex-col items-start p-[1.25rem] mt-[2rem]">
              <h3 className="font-[700] text-[1.25rem] ">Order Details</h3>
              <div className="flex gap-[2rem] w-fit">
                <div className="w-full font-[400] text-[1rem] mt-[1.5rem] space-y-[1rem]">
                  <div className="flex justify-between w-[100%] gap-[2rem] ">
                    <div className="font-[600] text-[1.15rem]">Address:</div>{" "}
                    <div>{`${customerData?.data?.pinCode}-${customerData?.data?.address}, ${customerData?.data?.city}`}</div>
                  </div>
                  <div className="flex justify-between w-[100%] gap-[2rem] ">
                    <div className="font-[600] text-[1.15rem]">
                      Delivery Time:
                    </div>{" "}
                    <div>{customerData?.data?.deliveryTime}</div>
                  </div>
                  <div className="flex justify-between w-[100%] gap-[2rem] ">
                    <div className="font-[600] text-[1.15rem]">Email:</div>{" "}
                    <div>{customerData.data.email}</div>
                  </div>
                  <div className="flex justify-between w-[100%] gap-[2rem] ">
                    <div className="font-[600] text-[1.15rem]">
                      Mobile Number:
                    </div>{" "}
                    <div>{customerData.data.mobileNumber}</div>
                  </div>
                  <div className="flex justify-between w-[100%] gap-[2rem] ">
                    <div className="font-[600] text-[1.15rem]">
                      Payment Method
                    </div>{" "}
                    <div>
                      {customerData.data.paymentMethod} -{" "}
                      {customerData.data.paymentStatus}
                    </div>
                  </div>
                  <div className="flex justify-between w-[100%] gap-[2rem] ">
                    <div className="font-[600] text-[1.15rem]">
                      Tracking Number:
                    </div>{" "}
                    <div>{customerData.data.trackingNo}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-[#f0f3f4] w-full flex flex-col items-start p-[1.25rem] mt-[2rem]">
            <h3 className="font-[700] text-[1.25rem] ">Ordered Items</h3>
            <div className="w-full mt-[1rem]">
              <Table
                isSN
                headers={tableHeader}
                data={orderDetails}
                // pagination={{ limit: 10, page: 1, total: 0 }}
                // handlePagination={() => {}}
              />
            </div>
          </div>
          <div className="mt-[2rem]">
            <TextArea
              label="Order Notes"
              className="W-1/2 cursor-not-allowed"
              disabled
              value={customerData?.data.orderNote}
            />
          </div>
          {/* Total */}
          <div className="mt-[1rem] flex flex-col items-end p-[1rem] gap-[1rem]">
            <h3 className="font-[700] text-[1.25rem] ">Total Amount</h3>
            <div className="flex justify-between gap-[2rem]">
              <div className="font-[600] text-[1.15rem]">Shipping Amount: </div>{" "}
              <div>
                {CurrencySign} {customerData.data.shippingAmount}{" "}
              </div>
            </div>
            <div className="flex gap-[2rem] justify-between">
              <div className="font-[600] text-[1.15rem]">Total Amount: </div>{" "}
              <div>
                {CurrencySign} {customerData.data.totalAmount}{" "}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const tableHeader = ["Product", "quantity", "Price", "Discount", "Sub Total"];
