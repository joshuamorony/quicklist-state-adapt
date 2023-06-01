import { effect, inject, Injectable } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { adapt } from "@state-adapt/angular";
import { Action } from "@state-adapt/core";
import { Source, toSource } from "@state-adapt/rxjs";
import { map } from "rxjs";
import { ChecklistItemService } from "../../checklist/data-access/checklist-item.service";
import {
  AddChecklist,
  EditChecklist,
  RemoveChecklist,
} from "../interfaces/checklist";
import { initialState, checklistsAdapter } from "./checklist.adapter";
import { StorageService } from "./storage.service";

@Injectable({
  providedIn: "root",
})
export class ChecklistService {
  private checklistItemService = inject(ChecklistItemService);
  private storageService = inject(StorageService);

  private checklistsLoaded$ = this.storageService
    .loadChecklists()
    .pipe(toSource("[Storage] checklists loaded"));

  private add$ = new Source<AddChecklist>("[Checklists] add");
  private remove$ = new Source<RemoveChecklist>("[Checklists] remove");
  private edit$ = new Source<EditChecklist>("[Checklists] edit");

  private store = adapt(["checklists", initialState, checklistsAdapter], {
    loadChecklists: this.checklistsLoaded$,
    add: this.add$.pipe(map((checklist) => this.addIdToChecklist(checklist))),
    remove: this.remove$,
    edit: this.edit$,
  });

  loaded = toSignal(this.store.loaded$, { requireSync: true });
  checklists = toSignal(this.store.checklists$, { requireSync: true });

  checklistsChanged = effect(() => {
    if (this.loaded()) {
      this.storageService.saveChecklists(this.checklists());
    }
  });

  add(checklist: AddChecklist) {
    this.add$.next(checklist);
  }

  remove(id: string) {
    this.checklistItemService.clearChecklistItems(id);
    this.remove$.next(id);
  }

  edit(id: string, data: AddChecklist) {
    this.edit$.next({ id, data });
  }

  private addIdToChecklist(checklist: Action<AddChecklist, string>) {
    return {
      ...checklist,
      payload: {
        ...checklist.payload,
        id: this.generateSlug(checklist.payload.title),
      },
    };
  }

  private generateSlug(title: string) {
    // NOTE: This is a simplistic slug generator and will not handle things like special characters.
    let slug = title.toLowerCase().replace(/\s+/g, "-");

    // Check if the slug already exists
    const matchingSlugs = this.checklists().find(
      (checklist) => checklist.id === slug
    );

    // If the title is already being used, add a string to make the slug unique
    if (matchingSlugs) {
      slug = slug + Date.now().toString();
    }

    return slug;
  }
}
