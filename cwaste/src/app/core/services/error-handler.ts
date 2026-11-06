// import { Injectable } from '@angular/core';
// import { MatSnackBar } from '@angular/material/snack-bar';

// @Injectable({ providedIn: 'root' })
// export class ErrorHandlerService {
//   constructor(private snackBar: MatSnackBar) {}

//   handle(error: any): void {
//     const message = this.getMessageFromError(error);
//     console.error('[ErrorHandler]', message, error);

//     this.snackBar.open(message, 'Dismiss', {
//       duration: 4000,
//       panelClass: ['mat-mdc-snack-bar-error'],
//     });
//   }

//   private getMessageFromError(error: any): string {
//     if (!error) return 'An unknown error occurred';

//     if (typeof error === 'string') return error;

//     if (error.error?.message) return error.error.message;

//     if (error.status === 0) return ' Server is unreachable';
//     if (error.status === 400) return 'Bad Request – please check input';
//     if (error.status === 401) return 'Unauthorized – please log in again';
//     if (error.status === 403) return 'Forbidden – not allowed';
//     if (error.status === 404) return 'Resource not found';
//     if (error.status === 500) return 'Server error – try again later';

//     return `Error: ${error.message || 'Something went wrong'}`;
//   }
// }

