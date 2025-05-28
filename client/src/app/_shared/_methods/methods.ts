import { HttpClient } from "@angular/common/http";
import { Injector } from "@angular/core";
import { API_BASE_URL } from "../config";
import { catchError, EMPTY } from "rxjs";
import { MessageService } from "primeng/api";

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
	const messageService = injector.get(MessageService);
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
			messageService.add({ severity: 'success', summary: `Accodato download ${fileName}`, detail: '' })
		);
	return dlSub;
}