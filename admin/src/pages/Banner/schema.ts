import { z } from "zod";

export const BannerSchema = z.object({
  name: z.string().min(1, "Name is Required"),
  // video_url: z.string().nullable().optional(),
  bannerItems: z.array(
    z.object({
      image: z.string().min(1, "Image is Required"),
      caption: z.string().optional(),
      captionCSS: z.string().optional().nullable(),
      title: z.string().min(1, "Title is Required"),
      titleCSS: z.string().optional().nullable(),
      subTitle: z.string().min(1, "Sub Title is Required"),
      subTitleCSS: z.string().optional().nullable(),
    }),
  ),
});
