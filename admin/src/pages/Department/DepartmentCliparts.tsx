import MediaComponent from "@/components/MediaComponent";
import { IMAGE_BASE_URL } from "@/constants";
import useTranslation from "@/locale/useTranslation";
import {
  useCreateClipartsMutation,
  useUpdateClipartByIdMutation,
} from "@/redux/services/department";
import { useAppSelector } from "@/redux/store/hooks";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { useEffect, useState } from "react";
import { MdFileUpload } from "react-icons/md";
import { useParams } from "react-router-dom";
import galleryIcon from "@/assets/gallery_icon.svg";

export default function DepartmentCliparts({ cliparts }: { cliparts: any }) {
  const { id } = useParams();
  const totalCliparts = 4;

  // State for managing open/close states of dialogs
  const [openStates, setOpenStates] = useState<boolean[]>(
    Array(totalCliparts).fill(false),
  );

  const [clipartImages, setClipartImage] = useState<(string | null)[]>(
    Array(totalCliparts).fill(null),
  );

  const [createClipart] = useCreateClipartsMutation();
  const [updateClipart] = useUpdateClipartByIdMutation();

  const selectedImage = useAppSelector((state) => state.media.selectedImage);

  useEffect(() => {
    if (cliparts) {
      setClipartImage((prev) => {
        const updatedImages = [...prev];
        cliparts.forEach((clipart: any) => {
          const position = clipart.positionNumber - 1;
          if (position >= 0 && position < totalCliparts) {
            updatedImages[position] = clipart.img_png;
          }
        });
        return updatedImages;
      });
    }
  }, [cliparts, totalCliparts]);

  const handleOpen = (index: number) => {
    setOpenStates((prev) =>
      prev.map((state, i) => (i === index ? true : state)),
    );
  };

  const handleClose = async (index: number) => {
    const body = {
      positionNumber: index + 1,
      departmentId: id,
      img_png: selectedImage,
    };
    const image = clipartImages[index];
    const newImage = cliparts.find((each) => each.img_png === image);
    if (clipartImages[index] === null || clipartImages[index] === undefined) {
      try {
        const response = await createClipart(body).unwrap();
        handleResponse({
          res: response,
          onSuccess: () => setOpenStates((prev) => prev.map((_) => false)),
        });
      } catch (error) {
        handleError({ error });
      }
    } else {
      try {
        const response = await updateClipart({
          body,
          id: newImage.id,
        }).unwrap();
        handleResponse({
          res: response,
          onSuccess: () => setOpenStates((prev) => prev.map((_) => false)),
        });
      } catch (error) {
        handleError({ error });
      }
    }
    setOpenStates((prev) =>
      prev.map((state, i) => (i === index ? false : state)),
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-[2rem] gap-x-[3rem] border mt-[3.25rem] p-[2rem] w-fit rounded-[0.75rem]">
      {Array.from({ length: totalCliparts }).map((_, index) => (
        <MediaComponent
          key={index}
          title={
            <ImageUploadUI
              index={index}
              image={clipartImages[index]}
              onUploadClick={() => handleOpen(index)}
            />
          }
          handleConfirmImage={() => handleClose(index)}
          open={openStates[index]}
          setOpen={(isOpen: boolean) => {
            setOpenStates((prev) =>
              prev.map((state, i) => (i === index ? isOpen : state)),
            );
          }}
        />
      ))}
    </div>
  );
}

// Props for ImageUploadUI component
interface ImageUploadUIProps {
  index: number;
  onUploadClick: () => void;
  image: string;
}

function ImageUploadUI({
  index,
  onUploadClick,
  image,
}: Readonly<ImageUploadUIProps>) {
  const translate = useTranslation();
  return (
    <button className="flex items-center gap-[2rem]" onClick={onUploadClick}>
      <div className="border md:w-[344px] h-fit bg-[#0090dd] text-white px-[1rem] py-[0.75rem] rounded-[0.75rem] flex gap-[1rem] justify-between items-center cursor-pointer">
        <p className="whitespace-nowrap">
          {translate("Position")} {index + 1}
        </p>
        <MdFileUpload size={22} />
      </div>
      {image !== null ? (
        <img
          src={`${IMAGE_BASE_URL}${image}`}
          alt={image}
          className="w-[75px] h-[75px] md:w-[108px] md:h-[108px] rounded-full"
          // crossOrigin="anonymous"
        />
      ) : (
        <img
          src={galleryIcon}
          alt="Gallery Icon"
          className="w-[108px] h-[108px] rounded-full object-contain"
        />
      )}
    </button>
  );
}
