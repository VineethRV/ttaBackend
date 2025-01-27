import * as auth from "./auth";
import { PrismaClient } from "@prisma/client";
import { Lab } from "../types/main";
import { statusCodes } from "../types/statusCodes";

const prisma = new PrismaClient();

export async function createLab(
  JWTtoken: string,
  name: string,
  semester: number,
  batches: string[],
  teachers: string,
  rooms: string[][],
  timetables: string[][],
  department?: string
): Promise<{ status: number; data: Lab | null }> {
  try {
    const { status, user } = await auth.getPosition(JWTtoken);
    if (user?.orgId == null) {
      return {
        status: statusCodes.BAD_REQUEST,
        data: null,
      };
    }

    if (status == statusCodes.OK && user && user.role != "viewer") {
      const existingLab = await prisma.lab.findFirst({
        where: {
          name: name,
          semester: semester,
          department:
            user.role == "admin" && department ? department : user.department,
          orgId: user.orgId,
        },
      });

      if (existingLab) {
        return { status: statusCodes.BAD_REQUEST, data: null };
      }

      const lab = await prisma.lab.create({
        data: {
          name: name,
          semester: semester,
          batches: batches.join(";"),
          teachers: teachers,
          rooms: rooms.map((batch) => batch.join(",")).join(";"),
          timetable: timetables.map((batch) => batch.join(",")).join(";"),
          department:
            user.role == "admin" && department ? department : user.department,
          orgId: user.orgId,
        },
      });
      return { status: statusCodes.CREATED, data: lab };
    }
    return {
      status: status == statusCodes.OK ? statusCodes.FORBIDDEN : status,
      data: null,
    };
  } catch (error) {
    console.error(error);
    return { status: statusCodes.INTERNAL_SERVER_ERROR, data: null };
  }
}

//TEACHER HANDELING HAS TO BE DONE
export async function deleteLabs(
  JWTtoken: string,
  labs: Lab[]
): Promise<{ status: number }> {
  try {
    const { status, user } = await auth.getPosition(JWTtoken);

    if (user?.orgId == null) {
      return { status: statusCodes.BAD_REQUEST };
    }

    if (status == statusCodes.OK && user && user.role != "viewer") {
      await prisma.lab.deleteMany({
        where: {
          OR: labs.map((lab) => ({
            name: lab.name,
            semester: lab.semester,
            department: user.role == "admin" ? lab.department : user.department,
            orgId: user.orgId as number,
          })),
        },
      });
      return { status: statusCodes.OK };
    }
    return {
      status: status == statusCodes.OK ? statusCodes.UNAUTHORIZED : status,
    };
  } catch (error) {
    console.error(error);
    return { status: statusCodes.INTERNAL_SERVER_ERROR };
  }
}

export type LabWithIds = {
  id: number;
  name: string;
  department: string | null;
  orgId: number;
  semester: number | null;
  batches: string | null;
  teachers: string | null;
  rooms: string | null;
  timetable: string | null;
};
export async function getLabs(
  JWTtoken: string,
  department: string | null = null,
  semester: number | null = null
): Promise<{ status: number; data: LabWithIds[] | null }> {
  try {
    const { status, user } = await auth.getPosition(JWTtoken)
    if (user?.orgId == null) {
      return {
        status: statusCodes.BAD_REQUEST,
        data: null,
      };
    }
    if (status == statusCodes.OK && user) {
      if(user.role=="admin"){ const labs = await prisma.lab.findMany({
          where: {
            orgId: user.orgId,
            semester: semester,
          },
        });
        return { status: statusCodes.OK, data: labs };
      }
      else{
        const labs = await prisma.lab.findMany({
          where: {
            orgId: user.orgId,
            department: user.department,
            semester: semester,
          },
        });
        return { status: statusCodes.OK, data: labs };
      }
  }
    return { status: status, data: null };
  } catch (error) {
    console.error(error);
    return { status: statusCodes.INTERNAL_SERVER_ERROR, data: null };
  }
}

export async function updateLab(
  JWTtoken: string,
  originalName: string,
  originalSemester: number,
  lab: Lab,
  originalDepartment?: string
): Promise<{ status: number; data: Lab | null }> {
  try {
    const { status, user } = await auth.getPosition(JWTtoken);

    if (user?.orgId == null) {
      return {
        status: statusCodes.BAD_REQUEST,
        data: null,
      };
    }

    if (status == statusCodes.OK && user && user.role != "viewer") {
      const existingLab = await prisma.lab.findFirst({
        where: {
          name: originalName,
          semester: originalSemester,
          department:
            user.role == "admin" && originalDepartment
              ? originalDepartment
              : user.department,
          orgId: user.orgId,
        },
      });

      if (!existingLab) {
        return { status: statusCodes.NOT_FOUND, data: null };
      }

      const updatedLab = await prisma.lab.update({
        where: { id: existingLab.id },
        data: {
          name: lab.name,
          semester: lab.semester,
          batches: lab.batches,
          teachers: lab.teachers,
          rooms: lab.rooms,
          timetable: lab.timetable,
          department:
            user.role == "admin" && lab.department
              ? lab.department
              : user.department,
        },
      });
      return { status: statusCodes.OK, data: updatedLab };
    }
    return {
      status: status == statusCodes.OK ? statusCodes.FORBIDDEN : status,
      data: null,
    };
  } catch (error) {
    console.error(error);
    return { status: statusCodes.INTERNAL_SERVER_ERROR, data: null };
  }
}

export async function peekLab(
  JWTtoken: string,
  name: string,
  semester: number,
  department?: string
): Promise<{ status: number; data: Lab | null }> {
  try {
    const { status, user } = await auth.getPosition(JWTtoken);

    if (user?.orgId == null) {
      return {
        status: statusCodes.BAD_REQUEST,
        data: null,
      };
    }

    if (status == statusCodes.OK && user) {
      const lab = await prisma.lab.findFirst({
        where: {
          name: name,
          semester: semester,
          department:
            user.role == "admin" && department ? department : user.department,
          orgId: user.orgId,
        },
      });
      return {
        status: lab ? statusCodes.OK : statusCodes.NOT_FOUND,
        data: lab,
      };
    }
    return { status: status, data: null };
  } catch (error) {
    console.error(error);
    return { status: statusCodes.INTERNAL_SERVER_ERROR, data: null };
  }
}
