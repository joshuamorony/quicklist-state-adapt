import { CommonModule } from "@angular/common";
import { Component, computed, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormBuilder, Validators } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { ChecklistService } from "../shared/data-access/checklist.service";
import { ChecklistItem } from "../shared/interfaces/checklist-item";
import { FormModalComponent } from "../shared/ui/form-modal.component";
import { ModalComponent } from "../shared/ui/modal.component";
import { ChecklistItemService } from "./data-access/checklist-item.service";
import { ChecklistItemHeaderComponent } from "./ui/checklist-item-header.component";
import { ChecklistItemListComponent } from "./ui/checklist-item-list.component";

@Component({
  standalone: true,
  imports: [
    CommonModule,
    ChecklistItemHeaderComponent,
    ChecklistItemListComponent,
    ModalComponent,
    FormModalComponent,
  ],
  selector: "app-checklist",
  template: `
    <app-checklist-item-header *ngIf="checklist() as checklist"
      [checklist]="checklist"
      (addItem)="formModalIsOpen.set(true)"
      (resetChecklist)="resetChecklistItems($event)"
    />

    <app-checklist-item-list
      [checklistItems]="items()"
      (toggle)="toggleChecklistItem($event)"
      (delete)="deleteChecklistItem($event)"
      (edit)="openEditModal($event)"
    />

    <app-modal [isOpen]="formModalIsOpen()">
      <ng-template>
        <app-form-modal
          [title]="checklistItemIdBeingEdited() ? 'Edit Item' : 'Create item'"
          [formGroup]="checklistItemForm"
          (close)="dismissModal()"
          (save)="
            checklistItemIdBeingEdited()
              ? editChecklistItem(checklistItemIdBeingEdited()!)
              : addChecklistItem(checklist()?.id)
          "
        ></app-form-modal>
      </ng-template>
    </app-modal>
  `,
})
export default class ChecklistComponent {
  formModalIsOpen = signal(false);
  checklistItemIdBeingEdited = signal<string | null>(null);

  params = toSignal(this.route.paramMap);

  items = computed(() =>
    this.checklistItemService
      .checklistItems()
      .filter((item) => item.checklistId === this.params()?.get("id"))
  );

  checklist = computed(() =>
    this.checklistService
      .checklists()
      .find((checklist) => checklist.id === this.params()?.get("id"))
  );

  checklistItemForm = this.fb.nonNullable.group({
    title: ["", Validators.required],
  });

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private checklistService: ChecklistService,
    private checklistItemService: ChecklistItemService
  ) {}

  dismissModal() {
    this.formModalIsOpen.set(false);
    this.checklistItemIdBeingEdited.set(null);
  }

  addChecklistItem(checklistId: string | undefined) {
    if (checklistId) {
      this.checklistItemService.add({
        item: this.checklistItemForm.getRawValue(),
        checklistId,
      });
    }
  }

  editChecklistItem(checklistItemId: string) {
    this.checklistItemService.edit({
      id: checklistItemId,
      data: this.checklistItemForm.getRawValue(),
    });
  }

  openEditModal(checklistItem: ChecklistItem) {
    this.checklistItemForm.patchValue({
      title: checklistItem.title,
    });
    this.checklistItemIdBeingEdited.set(checklistItem.id);
    this.formModalIsOpen.set(true);
  }

  toggleChecklistItem(itemId: string) {
    this.checklistItemService.toggle(itemId);
  }

  resetChecklistItems(checklistId: string) {
    this.checklistItemService.reset(checklistId);
  }

  deleteChecklistItem(id: string) {
    this.checklistItemService.remove(id);
  }
}
