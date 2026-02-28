import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { Navbar } from '../navbar/navbar';

@Component({
  selector: 'app-header',
  imports: [RouterLink, NgIcon, Navbar],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {}
