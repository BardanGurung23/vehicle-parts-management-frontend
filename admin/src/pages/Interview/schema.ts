import { z } from "zod";

export const BasicFormSchema = z.object({
  initials: z.string().min(1, "Initials is Required"),
  slug: z.string().min(1, "Slug is Required"),
  office_location: z.string().min(1, "Office Location is Required"),
  departmentId: z
    .union([z.number().optional(), z.string().optional()])
    .optional(),
  subDepartment: z.string().min(1, "Sub Department is Required"),
  entered_date: z.string().min(1, "Entered Date is Required"),
  web_view_img: z.string().min(1, "Web View Image is Required"),
  mobile_view_img: z.string().min(1, "Mobile View Image is Required"),
  emp_carousel_img: z.string().min(1, "Employee Carousel is Required"),
  emp_quote_img_one: z.string().min(1, "Employee Quote Image is Required"),
  emp_quote_img_two: z.string().min(1, "Employee Quote Image is Required"),
  work_style_interview_image: z
    .string()
    .min(1, "Work Style Interview Image is Required"),
  round_img: z.string().min(1, "Sticker is Required"),
  emp_carousel_hov_img: z
    .string()
    .min(1, "Employee Carousel Hover Image is Required"),
  designation: z.string().min(1, "Designation is Required"),
});

export const MessageFormScheme = z.object({
  message_img: z.string().min(1, "Message Image is Required"),
  message_title: z.string().min(1, "Message Title is Required"),
  message: z.string().min(1, "Message is Required"),
});

export const InterviewSchema = z.object({
  ...BasicFormSchema.shape,
  ...MessageFormScheme.shape,
});

export const QuestionOneSchema = z.object({
  question: z.string().min(1, "Question is Required"),
  answer: z.string().min(1, "Answer is Required"),
  img: z.string().optional(),
});

export const QuestionTwoSchema = z.object({
  heading: z.string().min(1, "Question is Required"),
  sub_heading: z.string().min(1, "Sub Heading is Required"),
  img_one: z.string().min(1, "First Image is Required"),
  img_two: z.string().min(1, "Second Image is Required"),
  timeTable: z.array(
    z.object({
      position: z.number().optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      date: z.string().optional(),
    }),
  ),
});
