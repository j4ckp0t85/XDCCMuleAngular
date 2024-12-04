import { HttpClient } from "@angular/common/http";
import { Injector } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { API_BASE_URL } from "../config";
import { catchError, EMPTY } from "rxjs";

export function downloadFile(
	injector: Injector,
	server: string,
	channel: string,
	bot: string,
	packageId: string,
	fileName: string,
	fileSize: string
) {
	const httpClient = injector.get(HttpClient);
	const snackBar = injector.get(MatSnackBar);
	const dlSub = httpClient
		.post(`${API_BASE_URL}/download`, {
			server,
			channel,
			bot,
			packageId,
			fileName,
			fileSize,
		})
		.pipe(catchError(() => EMPTY))
		.subscribe(() =>
			snackBar.open(`Accodato download ${fileName}`, undefined, {
				duration: 3000,
			})
		);
	return dlSub;
}