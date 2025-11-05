import { ApiResponse } from '../../utils/response.utils.js'
import { signUpSchema } from './auth.validation.js'

function formatZodValidationErrors(error) {
    return error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, '')
    }));
}

export const signUpController = async (req, res, next) => {
    try {
        const { error, value } = signUpSchema.validate(req.body);

        if (error) {
            const validationErrors = formatZodValidationErrors(error);
            return ApiError('could not validate sign up data')
        }

        const { email, name, password } = value;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return ApiResponse.sendErrorResponse(res, HTTP_STATUS.CONFLICT, ERROR_MESSAGES.DUPLICATE_ENTRY);
        }

        // Hash password
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Create user
        const newUser = await prisma.user.create({
            data: {
                email,
                name,
                passwordHash
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true
            }
        });

        // Generate tokens
        const accessToken = generateAccessToken({ id: newUser.id, email: newUser.email, role: newUser.role });
        const refreshToken = generateRefreshToken({ id: newUser.id, email: newUser.email, role: newUser.role });

        // Send success response with tokens
        ApiResponse.sendSuccessResponse(res, HTTP_STATUS.CREATED, SUCCESS_MESSAGES.CREATED, {
            user: newUser,
            accessToken,
            refreshToken
        });

    } catch (error) {
        throw new Error()
    }
};
