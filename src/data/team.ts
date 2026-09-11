import bradPhoto from "@/assets/team/brad-johnson.jpg.asset.json";
import katiePhoto from "@/assets/team/katie-sabey.jpg.asset.json";
import tysonPhoto from "@/assets/team/tyson-laford.jpg.asset.json";
import chasePhoto from "@/assets/team/chase-houghton.jpg.asset.json";
import jaredPhoto from "@/assets/team/Jared_Christensen_CEO.jpg.asset.json";
import codyPhoto from "@/assets/team/Cody_Smith_Director_of_Operations.jpg.asset.json";
import willPhoto from "@/assets/team/Will_Fitzgerald_Director_of_Sales.jpg.asset.json";
import natePhoto from "@/assets/team/Nate_Spanos_Senior_Lighting_Consultant.jpg.asset.json";
import alyssaPhoto from "@/assets/team/Alyssa_Gathercole_Lighting_Consultant_Midvale_Utah.jpg.asset.json";
import chelseaPhoto from "@/assets/team/Chelsea_Freitas-O_neil_Lighting_Consultant.jpg.asset.json";
import rylanPhoto from "@/assets/team/Rylan_Peck_Lighting_Consultant.jpg.asset.json";
import elisaPhoto from "@/assets/team/Elisa_Miller_Accounts_Receiveable.jpg.asset.json";
import alexPhoto from "@/assets/team/Alex_LaFord_Purchasing_Manager.jpg.asset.json";
import donPhoto from "@/assets/team/Don_Johnson_Owner.jpg.asset.json";
import perryPhoto from "@/assets/team/Perry_Fitzgerald_COO.jpg.asset.json";
import keilyPhoto from "@/assets/team/KeilyAuni_Merkley_Shworoom_Manager_Layton.jpg.asset.json";
import marianPhoto from "@/assets/team/Marian_Simpson_Showroom_Manager_Midavale_Utah.jpg.asset.json";
import mollyPhoto from "@/assets/team/Molly_Burns_Lighting_Consultant.jpg.asset.json";
import derekPhoto from "@/assets/derek-nielsen.jpg.asset.json";
import myaPhoto from "@/assets/team/Mya_Baca_Lighting_Consultant.jpg.asset.json";
import audreyPhoto from "@/assets/team/Audrey_Rickenbacker_Lighting_Consultant.jpg.asset.json";
import brookePhoto from "@/assets/team/Brooke_Hatch_Director_of_Marketing.jpg.asset.json";
import dysonPhoto from "@/assets/team/Dyson_Rivers_Warehouse_Manager.jpg.asset.json";
import zachPhoto from "@/assets/team/Zach_Grey_Service_Manager.jpg.asset.json";
import gregPhoto from "@/assets/team/Greg_Johnson_Owner_Lighting_Consultant.jpg.asset.json";
import jarinPhoto from "@/assets/team/Jarin_Broadbent_Lighting_Consusltant.jpg.asset.json";
import kamronPhoto from "@/assets/team/Kamron_Gurney_Lighting_Consultant.jpg.asset.json";
import kirtPhoto from "@/assets/team/Kirt_Victor_Lighting_Consultant_v2.png.asset.json";
import jasonPhoto from "@/assets/team/Jason_Petersen_v3.png.asset.json";
import ryanPhoto from "@/assets/team/Ryan_Reid_v2.png.asset.json";
import timPhoto from "@/assets/team/Tim_Johnson_Owner.jpg.asset.json";
import carsonPhoto from "@/assets/team/Carson_Bush_Lighting_Consultant.jpg.asset.json";
import murilloPhoto from "@/assets/team/Murillo_Miranda_Showrom_Manager_St._Goerge.jpg.asset.json";
import melissaPhoto from "@/assets/team/Melissa_McDermott_Senior_Lighting_Consultant.jpg.asset.json";
import kendalPhoto from "@/assets/team/Kendal_LaFord_Showroom_Manager_Orem_v2.png.asset.json";

export type TeamMember = {
  slug: string;
  name: string;
  role: string;
  location?: string;
  bio?: string;
  photo?: string;
  /** CSS object-position for the portrait crop, e.g. "50% 20%" */
  photoPosition?: string;
  email?: string;
};

export const teamMembers: TeamMember[] = [
  // Leadership
  {
    slug: "jared-christensen",
    name: "Jared Christensen",
    role: "Chief Executive Officer",
    photo: jaredPhoto.url,
  },
  {
    slug: "perry-fitzgerald",
    name: "Perry Fitzgerald",
    role: "Chief Operating Officer",
    photo: perryPhoto.url,
  },
  {
    slug: "don-johnson",
    name: "Don Johnson",
    role: "Owner",
    photo: donPhoto.url,
  },
  {
    slug: "brad-johnson",
    name: "Brad Johnson",
    role: "Owner",
    photo: bradPhoto.url,
  },
  {
    slug: "tim-johnson",
    name: "Tim Johnson",
    role: "Owner",
    photo: timPhoto.url,
  },
  {
    slug: "greg-johnson",
    name: "Greg Johnson",
    role: "Owner",
    photo: gregPhoto.url,
  },
  {
    slug: "cody-smith",
    name: "Cody Smith",
    role: "Director of Operations",
    photo: codyPhoto.url,
  },
  {
    slug: "brooke-hatch",
    name: "Brooke Hatch",
    role: "Director of Marketing",
    photo: brookePhoto.url,
  },
  {
    slug: "will-fitzgerald",
    name: "Will Fitzgerald",
    role: "Director of Sales",
    photo: willPhoto.url,
  },
  // Showroom Managers
  {
    slug: "kendal-yates",
    name: "Kendal Yates",
    role: "Showroom Manager",
    location: "Orem, Utah",
    photo: kendalPhoto.url,
  },
  {
    slug: "alyssa-gathercole",
    name: "Alyssa Gathercole",
    role: "Showroom Manager",
    location: "Midvale, Utah",
    photo: alyssaPhoto.url,
  },
  {
    slug: "katie-sabey",
    name: "Katie Sabey",
    role: "Showroom Manager",
    location: "Sandy, Utah",
    photo: katiePhoto.url,
  },
  {
    slug: "keilyauni-merkley",
    name: "KeilyAuni Merkley",
    role: "Showroom Manager",
    location: "Layton, Utah",
    photo: keilyPhoto.url,
  },
  {
    slug: "murillo-miranda",
    name: "Murillo Miranda",
    role: "Showroom Manager",
    location: "St. George, Utah",
    photo: murilloPhoto.url,
  },
  {
    slug: "stephanie-diaz",
    name: "Stephanie Diaz",
    role: "Showroom Manager",
    location: "Heber, Utah",
  },
  // Lighting Consultants
  {
    slug: "tyson-laford",
    name: "Tyson LaFord",
    role: "Principal Lighting Consultant",
    photo: tysonPhoto.url,
  },
  {
    slug: "nate-spanos",
    name: "Nate Spanos",
    role: "Lighting Consultant",
    photo: natePhoto.url,
  },
  {
    slug: "chase-houghton",
    name: "Chase Houghton",
    role: "Lighting Consultant",
    photo: chasePhoto.url,
  },
  {
    slug: "derek-nielsen",
    name: "Derek Nielsen",
    role: "Lighting Consultant",
    photo: derekPhoto.url,
  },
  {
    slug: "marian-simpson",
    name: "Marian Simpson",
    role: "Lighting Consultant",
    photo: marianPhoto.url,
  },
  {
    slug: "chelsea-freitas-oneil",
    name: "Chelsea Freitas-O'Neil",
    role: "Lighting Consultant",
    photo: chelseaPhoto.url,
  },
  {
    slug: "rylan-peck",
    name: "Rylan Peck",
    role: "Lighting Consultant",
    photo: rylanPhoto.url,
  },
  {
    slug: "molly-burns",
    name: "Molly Burns",
    role: "Lighting Consultant",
    photo: mollyPhoto.url,
  },
  {
    slug: "mya-baca",
    name: "Mya Baca",
    role: "Lighting Consultant",
    photo: myaPhoto.url,
  },
  {
    slug: "audrey-rickenbacker",
    name: "Audrey Rickenbacker",
    role: "Lighting Consultant",
    photo: audreyPhoto.url,
  },
  {
    slug: "carson-bush",
    name: "Carson Bush",
    role: "Lighting Consultant",
    photo: carsonPhoto.url,
  },
  {
    slug: "melissa-mcdermott",
    name: "Melissa McDermott",
    role: "Principal Lighting Consultant",
    photo: melissaPhoto.url,
  },
  {
    slug: "jarin-broadbent",
    name: "Jarin Broadbent",
    role: "Principal Lighting Consultant",
    photo: jarinPhoto.url,
  },
  {
    slug: "kamron-gurney",
    name: "Kamron Gurney",
    role: "Lighting Consultant",
    photo: kamronPhoto.url,
  },
  {
    slug: "kirt-victor",
    name: "Kirt Victor",
    role: "Lighting Consultant",
    photo: kirtPhoto.url,
  },
  {

    slug: "ryan-reid",
    name: "Ryan Reid",
    role: "Lighting Consultant",
    photo: ryanPhoto.url,
  },
  {
    slug: "jason-petersen",
    name: "Jason Petersen",
    role: "Chairman of the Board",
    photo: jasonPhoto.url,
    photoPosition: "50% 12%",
  },
  // Operations & Support

  {
    slug: "alex-laford",
    name: "Alex LaFord",
    role: "Purchasing Manager",
    photo: alexPhoto.url,
  },
  {
    slug: "dyson-rivers",
    name: "Dyson Rivers",
    role: "Inventory Manager",
    photo: dysonPhoto.url,
  },
  {
    slug: "cameron-peck",
    name: "Cameron Peck",
    role: "Support Team Manager",
  },
  {
    slug: "zander",
    name: "Zander",
    role: "Service Technician",
  },
  {
    slug: "zach-grey",
    name: "Zach Grey",
    role: "Service Manager",
    photo: zachPhoto.url,
  },


  {
    slug: "elisa-miller",
    name: "Elisa Miller",
    role: "Accounts Receivable",
    photo: elisaPhoto.url,
  },
];

export const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
