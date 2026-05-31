export type CalendarStatus = "available" | "booked" | "unavailable";

export type HairStyleOption =
  | "kinky"
  | "boho"
  | "knotless"
  | "ghana weaving"
  | "jayda wayda";

export type HairSizeOption = "small" | "smedium" | "medium" | "large";

export type HairLengthOption = "shoulder" | "bra" | "waist";

export type HairStyle = {
  style: HairStyleOption;
  size: HairSizeOption;
  length: HairLengthOption;
  additionalDetails?: string;
};

export type CalendarClient = {
  id?: string;
  name: string;
  startTime?: string;
  hairStyle: HairStyle;
  email?: string;
  phone?: string;
  notes?: string;
};

export type CalendarEntry = {
  id: string;
  date: string;
  status: CalendarStatus;
  clients: CalendarClient[];
  startTime?: string;
  endTime?: string;
  notes?: string;
  updatedAt: string;
  createdAt?: string;
};
