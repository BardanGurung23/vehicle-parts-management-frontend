import galleryIcon from "@/assets/gallery_icon.svg";
import { IMAGE_BASE_URL } from "@/constants";

export default function ImageInputUIComponent({
  type,
  image,
  error,
}: {
  type: string;
  image?: string;
  error: string | undefined;
}) {
  return (
    <>
      <div
        className={`h-[180px] border border-[#C9CBD1] rounded-[6px] flex items-center justify-center ${
          type === "small" ? "w-[147px] " : "w-[307px]"
        }`}
      >
        {image !== undefined ? (
          <img
            src={`${IMAGE_BASE_URL}${image}`}
            alt="Gallery Icon"
            className="object-contain w-[307px] h-[140px]"
            crossOrigin="anonymous"
          />
        ) : (
          <img src={galleryIcon} alt="Gallery Icon" />
        )}
      </div>
      {type === "large" && (
        <p className="font-[400] text-[0.75rem] text-start mt-[2px] text-[#626c78]">
          {"Allowed JPG, GIF or PNG. Max size of 1MB"}
        </p>
      )}
      {error && (
        <span className="input-error">
          {typeof error === "string" ? error : error.message}
        </span>
      )}
    </>
  );
}

export const MultipleImageInputUI = ({
  images,
  imageIndex,
}: {
  images: string | string[];
  imageIndex: number;
}) => {
  return (
    <div
      className={`h-[10rem] w-[25rem] border border-dashed border-[#C9CBD1] rounded-[6px] flex items-center justify-center `}
    >
      {Array.isArray(images) && images.length > 0 ? (
        <div>
          <div className="h-[10rem] w-[25rem]">
            <img
              src={`${IMAGE_BASE_URL}${
                typeof images[imageIndex] === "string"
                  ? images[imageIndex]
                  : images[imageIndex].img_url
              }`}
              alt="Gallery Image"
              className="object-contain w-full h-full p-[1rem]"
              crossOrigin="anonymous"
            />
          </div>
        </div>
      ) : typeof images === "string" ? (
        <img
          src={`${IMAGE_BASE_URL}${images}`}
          alt="Gallery Icon"
          className="object-contain h-full w-full p-[1rem]"
          crossOrigin="anonymous"
        />
      ) : (
        <img
          src={galleryIcon}
          alt="Gallery Icon"
          className="h-[3rem] w-[5rem]"
        />
      )}
    </div>
  );
};
