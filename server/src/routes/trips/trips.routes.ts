import { createRoute, z } from "@hono/zod-openapi";
import { authMiddleware } from "../../middleware/auth";
import { tripSchemas } from "./trips.schemas";

const tags = ["trips"];

export const createTrip = createRoute({
  method: "post",
  path: "/trips",
  middleware: [authMiddleware],
  tags,
  security: [
    {
      BearerAuth: [],
    },
  ],
  request: {
    body: {
      content: {
        "application/json": {
          schema: tripSchemas.createTrip,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: tripSchemas.trip,
        },
      },
      description: "Trip created successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
        },
      },
      description: "Invalid request data",
    },
    401: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
        },
      },
      description: "Unauthorized",
    },
    500: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
        },
      },
      description: "Internal server error",
    },
  },
});

export const getTrips = createRoute({
  method: "get",
  path: "/trips",
  tags,
  responses: {
    200: {
      content: {
        "application/json": {
          schema: tripSchemas.tripsArray,
        },
      },
      description: "List of trips",
    },
    500: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
        },
      },
      description: "Internal server error",
    },
  },
});

export const getTrip = createRoute({
  method: "get",
  path: "/trips/{tripId}",
  tags,
  request: {
    params: z
      .object({
        tripId: z.number().openapi({
          type: "number",
          example: 1,
          param: {
            name: "tripId",
            in: "path",
          },
        }),
      })
      .openapi("TripParams", {
        type: "object",
        param: {
          name: "tripId",
          in: "path",
        },
      }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: tripSchemas.tripWithDays,
        },
      },
      description: "Trip with days",
    },
    404: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
        },
      },
      description: "Trip not found",
    },
    500: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
        },
      },
      description: "Internal server error",
    },
  },
});

export const addTripDay = createRoute({
  method: "post",
  path: "/trips/{tripId}/days",
  middleware: [authMiddleware],
  tags,
  security: [
    {
      BearerAuth: [],
    },
  ],
  request: {
    params: z
      .object({
        tripId: z.number().openapi({
          type: "number",
          description: "Trip ID",
          example: 1,
          param: {
            name: "tripId",
            in: "path",
          },
        }),
      })
      .openapi({
        type: "object",
        param: {
          name: "tripId",
          in: "path",
        },
      }),
    body: {
      content: {
        "application/json": {
          schema: tripSchemas.addTripDay,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: tripSchemas.tripDay,
        },
      },
      description: "Trip day added successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
        },
      },
      description: "Invalid request data",
    },
    401: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
        },
      },
      description: "Unauthorized",
    },
    404: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
        },
      },
      description: "Trip not found",
    },
    500: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
        },
      },
      description: "Internal server error",
    },
  },
});

export const getTripDay = createRoute({
  method: "get",
  path: "/trips/{tripId}/days/{dayId}",
  tags,
  request: {
    params: z
      .object({
        tripId: z
          .number()
          .openapi({
            type: "number",
            description: "Trip ID",
            example: 1,
            param: {
              name: "tripId",
              in: "path",
            },
          })
          .openapi({
            type: "object",
            param: {
              name: "tripId",
              in: "path",
            },
          }),
        dayId: z.number().openapi({
          type: "number",
          description: "Trip day ID",
          example: 1,
          param: {
            name: "dayId",
          },
        }),
      })
      .openapi({
        type: "object",
        param: {
          name: "tripId",
        },
      }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: tripSchemas.tripDayWithSelections,
        },
      },
      description: "Trip day with selections",
    },
    404: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
        },
      },
      description: "Trip day not found",
    },
    500: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
        },
      },
      description: "Internal server error",
    },
  },
});

export const createDaySelection = createRoute({
  method: "post",
  path: "/trips/{tripId}/days/{dayId}/selections",
  tags,
  request: {
    params: z
      .object({
        tripId: z
          .number()
          .openapi({
            type: "number",
            description: "Trip ID",
            example: 1,
            param: {
              name: "tripId",
              in: "path",
            },
          })
          .openapi({
            type: "object",
            param: {
              name: "tripId",
              in: "path",
            },
          }),
        dayId: z.number().openapi({
          type: "number",
          description: "Trip day ID",
          example: 1,
          param: {
            name: "dayId",
          },
        }),
      })
      .openapi({
        type: "object",
        param: {
          name: "tripId",
        },
      }),
    body: {
      content: {
        "application/json": {
          schema: tripSchemas.createDaySelection,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: tripSchemas.userDaySelection,
        },
      },
      description: "Day selection created successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
        },
      },
      description: "Invalid request data",
    },
    404: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
        },
      },
      description: "Trip day not found",
    },
    500: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
        },
      },
      description: "Internal server error",
    },
  },
});

export const updateDaySelection = createRoute({
  method: "put",
  path: "/trips/{tripId}/days/{dayId}/selections/{selectionId}",
  middleware: [authMiddleware],
  tags,
  security: [
    {
      BearerAuth: [],
    },
  ],
  request: {
    params: z
      .object({
        tripId: z.number().openapi({
          type: "number",
          description: "Trip ID",
          example: 1,
          param: {
            name: "tripId",
            in: "path",
          },
        }),
        dayId: z.number().openapi({
          type: "number",
          description: "Trip day ID",
          example: 1,
          param: {
            name: "dayId",
            in: "path",
          },
        }),
        selectionId: z.number().openapi({
          type: "number",
          description: "Selection ID",
          example: 1,
          param: {
            name: "selectionId",
          },
        }),
      })
      .openapi({
        type: "object",
        param: {
          name: "tripId",
        },
      }),
    body: {
      content: {
        "application/json": {
          schema: tripSchemas.createDaySelection,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: tripSchemas.userDaySelection,
        },
      },
      description: "Day selection updated successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
        },
      },
      description: "Invalid request data",
    },
    401: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
        },
      },
      description: "Unauthorized",
    },
    404: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
        },
      },
      description: "Selection not found",
    },
    500: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
        },
      },
      description: "Internal server error",
    },
  },
});

export const deleteDaySelection = createRoute({
  method: "delete",
  path: "/trips/{tripId}/days/{dayId}/selections/{selectionId}",
  middleware: [authMiddleware],
  tags,
  security: [
    {
      BearerAuth: [],
    },
  ],
  request: {
    params: z
      .object({
        tripId: z.number().openapi({
          type: "number",
          description: "Trip ID",
          example: 1,
          param: {
            name: "tripId",
            in: "path",
          },
        }),
        dayId: z.number().openapi({
          type: "number",
          description: "Trip day ID",
          example: 1,
          param: {
            name: "dayId",
            in: "path",
          },
        }),
        selectionId: z.number().openapi({
          type: "number",
          description: "Selection ID",
          example: 1,
          param: {
            name: "selectionId",
            in: "path",
          },
        }),
      })
      .openapi({
        type: "object",
        param: {
          name: "tripId",
        },
      }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: tripSchemas.success,
        },
      },
      description: "Day selection deleted successfully",
    },
    401: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
        },
      },
      description: "Unauthorized",
    },
    404: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
        },
      },
      description: "Selection not found",
    },
    500: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
        },
      },
      description: "Internal server error",
    },
  },
});
