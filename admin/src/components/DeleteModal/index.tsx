import { DialogTitle, DialogTrigger } from "@radix-ui/react-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
} from "../ui/dialog";
import { TbTrashXFilled } from "react-icons/tb";
import React from "react";
import useTranslation from "@/locale/useTranslation";

type DeleteModalProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleDeleteTrigger: (id: number, isDeleted?: boolean) => void;
  handleConfirmDelete: () => void;
};

export default function DeleteModal({
  open,
  setOpen,
  handleDeleteTrigger,
  handleConfirmDelete,
}: DeleteModalProps) {
  const translate = useTranslation();

  const handleCancelButton = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger onClick={handleDeleteTrigger}>
        <TbTrashXFilled size={22} className="text-error cursor-pointer hover:opacity-80 transition-opacity" />
      </DialogTrigger>
      <DialogContent className="w-fit p-[3rem]">
        <DialogHeader>
          <DialogTitle>
            <span className="text-[1rem] font-[500] text-error text-center">
              {translate("Do you want to delete this Item?")}
            </span>
          </DialogTitle>
        </DialogHeader>
        <DialogFooter>
          <div className="flex justify-center gap-[2rem] w-full mt-[1rem]">
            <button
              className="bg-error text-error-on py-[0.5rem] px-[0.75rem] h-fit rounded-[6px] flex items-center hover:opacity-90 transition-opacity"
              onClick={handleConfirmDelete}
            >
              <span className="font-[400] text-[0.75rem]">
                {translate("Delete")}
              </span>
            </button>
            <button
              className="bg-surface-container-highest text-on-surface h-fit py-[0.5rem] px-[0.75rem] rounded-[6px] flex items-center hover:bg-surface-container transition-colors"
              onClick={handleCancelButton}
            >
              <span className="font-[400] text-[0.75rem]">
                {translate("Cancel")}
              </span>
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
