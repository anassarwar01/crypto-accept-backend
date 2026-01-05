import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../../../helper/dto/response.dto';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;

        return next.handle().pipe(
            map((data) => {
                // If the data is already an ApiResponse instance, return it as is
                if (data instanceof ApiResponse) {
                    return data;
                }

                // Wrap the data in a standardized ApiResponse
                return new ApiResponse(statusCode, 'Request successful', data);
            }),
        );
    }
}
