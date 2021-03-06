import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'tanam-theme-overview',
  templateUrl: './theme-overview.component.html',
  styleUrls: ['./theme-overview.component.scss']
})
export class ThemeOverviewComponent implements OnInit {
  readonly createTypeForm: FormGroup = this.formBuilder.group({
    title: [null, [Validators.required]],
  });

  constructor(
    private readonly router: Router,
    private readonly formBuilder: FormBuilder,
    private readonly themeService: ThemeService,
  ) { }

  ngOnInit() {
  }

  createTheme() {
    const themeId = this.themeService.getNewId();
    this.themeService.create(themeId);
    this.router.navigateByUrl(`/_/admin/theme/${themeId}/edit`);
  }
}
