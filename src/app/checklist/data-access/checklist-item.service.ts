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
  storageService = inject(StorageService);

  private checklistItemsLoaded$ = this.storageService
    .loadChecklistItems()
    .pipe(toSource("[Storage] checklist items loaded"));

  private add$ = new Source<AddChecklistItem>("[Checklist Items] add");
  private remove$ = new Source<RemoveChecklistItem>("[Checklist Items] remove");
  private edit$ = new Source<EditChecklistItem>("[Checklist Items] edit");
  private clearChecklistItems$ = new Source<RemoveChecklist>(
    "[Checklist Items] removeAllItems"
  );
  private toggle$ = new Source<RemoveChecklistItem>("[Checklist Items] toggle");
  private reset$ = new Source<RemoveChecklist>("[Checklist Items] reset");

  store = adapt(["checklistItems", initialState, checklistItemsAdapter], {
    loadChecklistItems: this.checklistItemsLoaded$,
    add: this.add$,
    remove: this.remove$,
    edit: this.edit$,
    toggle: this.toggle$,
    reset: this.reset$,
    clearChecklistItems: this.clearChecklistItems$,
  });

  loaded = toSignal(this.store.loaded$, { requireSync: true });
  checklistItems = toSignal(this.store.checklistItems$, { requireSync: true });

  checklistItemsChanged = effect(() => {
    if (this.loaded()) {
      this.storageService.saveChecklistItems(this.checklistItems());
    }
  });

  reset(checklistId: RemoveChecklist) {
    this.reset$.next(checklistId)
  }

  toggle(itemId: RemoveChecklistItem) {
    this.toggle$.next(itemId);
  }

  add(item: AddChecklistItem) {
    this.add$.next(item)
  }

  edit(item: EditChecklistItem) {
    this.edit$.next(item);
  }

  remove(id: RemoveChecklistItem) {
    this.remove$.next(id);
  }

  clearChecklistItems(checklistId: RemoveChecklist) {
    this.clearChecklistItems$.next(checklistId);
  }
}
