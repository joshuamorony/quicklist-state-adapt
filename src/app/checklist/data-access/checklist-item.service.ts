import { Injectable, signal, effect, computed, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { adapt } from "@state-adapt/angular";
import { Source, toSource } from "@state-adapt/rxjs";
import { RemoveChecklist } from "src/app/shared/interfaces/checklist";
import { StorageService } from "../../shared/data-access/storage.service";
import {
  AddChecklistItem,
  EditChecklistItem,
  RemoveChecklistItem,
} from "../../shared/interfaces/checklist-item";
import { checklistItemsAdapter, initialState } from "./checklist-item.adapter";

@Injectable({
  providedIn: "root",
})
export class ChecklistItemService {
  private storageService = inject(StorageService);

  private checklistItemsLoaded$ = this.storageService
    .loadChecklistItems()
    .pipe(toSource("[Storage] checklist items loaded"));

  add$ = new Source<AddChecklistItem>("[Checklist Items] add");
  remove$ = new Source<RemoveChecklistItem>("[Checklist Items] remove");
  edit$ = new Source<EditChecklistItem>("[Checklist Items] edit");
  checklistRemoved$ = new Source<RemoveChecklist>(
    "[Checklist Items] checklistRemoved$"
  );
  toggle$ = new Source<RemoveChecklistItem>("[Checklist Items] toggle");
  reset$ = new Source<RemoveChecklist>("[Checklist Items] reset");

  private store = adapt(["checklistItems", initialState, checklistItemsAdapter], {
    loadChecklistItems: this.checklistItemsLoaded$,
    add: this.add$,
    remove: this.remove$,
    edit: this.edit$,
    toggle: this.toggle$,
    reset: this.reset$,
    clearChecklistItems: this.checklistRemoved$,
  });

  loaded = toSignal(this.store.loaded$, { requireSync: true });
  checklistItems = toSignal(this.store.checklistItems$, { requireSync: true });

  checklistItemsChanged = effect(() => {
    if (this.loaded()) {
      this.storageService.saveChecklistItems(this.checklistItems());
    }
  });
}
