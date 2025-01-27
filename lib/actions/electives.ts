import * as auth from "./auth";
import { PrismaClient } from "@prisma/client";
import { Elective } from "../types/main";
import { statusCodes } from "../types/statusCodes";

const prisma = new PrismaClient();

export async function createElective(
  JWTtoken: string,
  name: string,
  courses: string,
  teachers: string,
  rooms: string,
  semester: number,
  timetable: string | null = null,
  department: string | null = null
): Promise<{ status: number; elective: Elective | null }> {
  try {
    const { status, user } = await auth.getPosition(JWTtoken);

    if (user?.orgId == null) {
      return {
        status: statusCodes.BAD_REQUEST,
        elective: null,
      };
    }

    if (status == statusCodes.OK && user) {
      if (user.role !== "viewer") {
        const elective: Elective = {
          name: name,
          department:
            user.role === "admin" && department ? department : user.department,
          courses: courses,
          teachers: teachers,
          rooms: rooms,
          semester: semester,
          orgId: user.orgId,
          timetable: timetable
            ? timetable
            : "0,0,0,0,0,0;0,0,0,0,0,0;0,0,0,0,0,0;0,0,0,0,0,0;0,0,0,0,0,0;0,0,0,0,0,0",
        };

        const duplicate = await prisma.elective.findFirst({
          where: {
            name,
            department: elective.department,
            orgId: user.orgId,
          },
        });

        if (duplicate) {
          return {
            status: statusCodes.BAD_REQUEST,
            elective: null,
          };
        }

        await prisma.elective.create({
          data: elective,
        });

        return {
          status: statusCodes.CREATED,
          elective,
        };
      }
      return {
        status: statusCodes.FORBIDDEN,
        elective: null,
      };
    }
    return {
      status: status,
      elective: null,
    };
  } catch {
    return {
      status: statusCodes.INTERNAL_SERVER_ERROR,
      elective: null,
    };
  }
}

export async function updateElective(
  JWTtoken: string,
  originalName: string,
  originalDepartment: string | null = null,
  updatedElective: Elective
): Promise<{ status: number; elective: Elective | null }> {
  try {
    const { status, user } = await auth.getPosition(JWTtoken);

    if (user?.orgId == null) {
      return {
        status: statusCodes.BAD_REQUEST,
        elective: null,
      };
    }

    if (status == statusCodes.OK && user) {
      if (user.role !== "viewer") {
        const elective = await prisma.elective.findFirst({
          where: {
            name: originalName,
            department:
              user.role === "admin" && originalDepartment
                ? originalDepartment
                : user.department,
            orgId: user.orgId,
          },
        });

        if (!elective) {
          return {
            status: statusCodes.NOT_FOUND,
            elective: null,
          };
        }

        const updated = await prisma.elective.update({
          where: {
            id: elective.id,
          },
          data: {
            name: updatedElective.name,
            department:
              user.role === "admin" && updatedElective.department
                ? updatedElective.department
                : user.department,
            courses: updatedElective.courses,
            teachers: updatedElective.teachers,
            rooms: updatedElective.rooms,
            semester: updatedElective.semester,
            timetable: updatedElective.timetable,
          },
        });

        return {
          status: statusCodes.OK,
          elective: updated,
        };
      }
      return {
        status: statusCodes.FORBIDDEN,
        elective: null,
      };
    }
    return {
      status: status,
      elective: null,
    };
  } catch {
    return {
      status: statusCodes.INTERNAL_SERVER_ERROR,
      elective: null,
    };
  }
}

export async function peekElective(
  JWTtoken: string,
  name: string,
  semester: number,
  department?: string
): Promise<{ status: number; elective: Elective | null }> {
  try {
    const { status, user } = await auth.getPosition(JWTtoken);

    if (user?.orgId == null) {
      return {
        status: statusCodes.BAD_REQUEST,
        elective: null,
      };
    }

    if (status == statusCodes.OK && user) {
      const elective = await prisma.elective.findFirst({
        where: {
          name: name,
          semester: semester,
          department:
            user.role === "admin" && department ? department : user.department,
          orgId: user.orgId,
        },
      });

      if (!elective) {
        return {
          status: statusCodes.NOT_FOUND,
          elective: null,
        };
      }

      return {
        status: statusCodes.OK,
        elective,
      };
    }
    return {
      status: status,
      elective: null,
    };
  } catch {
    return {
      status: statusCodes.INTERNAL_SERVER_ERROR,
      elective: null,
    };
  }
}

export async function getElectives(
  JWTtoken: string,
  semester: number,
  department?: string
): Promise<{ status: number; electives: Elective[] | null }> {
  try {
    const { status, user } = await auth.getPosition(JWTtoken);

    if (user?.orgId == null) {
      return {
        status: statusCodes.BAD_REQUEST,
        electives: null,
      };
    }

    if (status == statusCodes.OK && user) {
      const electives = await prisma.elective.findMany({
        where: {
          semester: semester,
          department:
            user.role === "admin" && department ? department : user.department,
          orgId: user.orgId,
        },
        select: {
          name: true,
          department: true,
          orgId: true,
          courses:true,
          teachers:true,
          rooms:true,
          semester:true,
          timetable:true
        },
      });

      return {
        status: statusCodes.OK,
        electives: electives,
      };
    }
    return {
      status: status,
      electives: null,
    };
  } catch {
    return {
      status: statusCodes.INTERNAL_SERVER_ERROR,
      electives: null,
    };
  }
}

export async function deleteElective(
  JWTtoken: string,
  name: string,
  semester: number,
  department?: string
): Promise<{ status: number; elective: Elective | null }> {
  try {
    const { status, user } = await auth.getPosition(JWTtoken);

    if (user?.orgId == null) {
      return {
        status: statusCodes.BAD_REQUEST,
        elective: null,
      };
    }

    if (status == statusCodes.OK && user) {
      if (user.role !== "viewer") {
        const elective = await prisma.elective.findFirst({
          where: {
            name: name,
            semester: semester,
            department:
              user.role === "admin" && department
                ? department
                : user.department,
            orgId: user.orgId,
          },
        });

        if (!elective) {
          return {
            status: statusCodes.NOT_FOUND,
            elective: null,
          };
        }

        await prisma.elective.delete({
          where: {
            id: elective.id,
          },
        });

        return {
          status: statusCodes.OK,
          elective,
        };
      }
      return {
        status: statusCodes.FORBIDDEN,
        elective: null,
      };
    }
    return {
      status: status,
      elective: null,
    };
  } catch {
    return {
      status: statusCodes.INTERNAL_SERVER_ERROR,
      elective: null,
    };
  }
}
