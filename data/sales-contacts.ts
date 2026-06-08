export type SalesContact = {
  id: string;
  name: string;
  phones: string[];
  qrImage: string;
};

export const SALES_CONTACTS: SalesContact[] = [
  {
    id: "liu-deyan",
    name: "刘德琰",
    phones: ["13712769500"],
    qrImage: "/images/sales/liu-deyan.png",
  },
  {
    id: "sun-liting",
    name: "孙立霆Darren",
    phones: ["18368729678", "13713323136"],
    qrImage: "/images/sales/sun-liting.png",
  },
  {
    id: "zhong-mingyuan",
    name: "钟明远",
    phones: ["18122928166"],
    qrImage: "/images/sales/zhong-mingyuan.png",
  },
  {
    id: "yang-xuejun",
    name: "杨雪军",
    phones: ["18688610987"],
    qrImage: "/images/sales/yang-xuejun.png",
  },
];
