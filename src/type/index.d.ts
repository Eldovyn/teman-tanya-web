declare interface RegisterInput {
    username: string;
    email: string;
    password: string;
    confirm_password: string;
    provider: string
}

declare namespace NodeJS {
    interface Timeout {
        // define the properties and methods of the Timeout type
    }
}

declare interface AccountActiveResponse {
    data?: {
        created_at: string;
        expired_at: string;
        id: string;
        token?: string;
        updated_at: number;
    },
    message: string,
    user: {
        email?: string;
        id: string;
        username: string;
        avatar: string;
        is_active: boolean;
        provider: string
    }
}

declare interface LoginInput {
    email: string;
    password: string;
    provider: string
}

declare interface FormErrorsRegister {
    username?: string[];
    email?: string[];
    password?: string[];
    confirm_password?: string[];
    password_security?: string[];
    password_match?: string[];
}

declare interface FormErrorsLogin {
    email?: string[];
    password?: string[];
}

declare interface FormErrorsOTP {
    otp?: string[]
}

declare interface ErrorResponse {
    message: string;
    errors?: {
        [field: string]: string[];
    };
    data?: {
        [field: string]: string[];
    };
    token?: {
        [field: string]: string[];
    };
}

declare interface RoomChat {
    id: string;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
    title: string;
    room: string;
}

declare interface GetAllRoomResponse {
    message: string;
    data: RoomChat[] | [];
}