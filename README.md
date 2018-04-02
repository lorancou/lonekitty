Lone Kitty
================================================================================

Game entry for Ludum Dare #22, theme: Alone
--------------------------------------------------------------------------------

Contact: <hello@lorancou.net>

License
--------------------------------------------------------------------------------

This program is free software: you can redistribute it and/or modify it under the
terms of the GNU General Public License as published by the Free Software
Foundation, either version 3 of the License, or (at your option) any later
version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this
program (LICENSE file). If not, see <http://www.gnu.org/licenses/>.

What would have helped
--------------------------------------------------------------------------------

- Vector math lib
- Collisions lib
- Sound lib, browser support for the Audio class is *POOR*
  => SoundManager2 looks allright, but could get it to work (snif)
- Anim lib

Known issues
--------------------------------------------------------------------------------

Testing under Debian "squeeze"
- SFXs won't play with my version of Iceweasel
- SFX sometimes won't play, or sometimes scratch with my version of Chromium, it
  happens that they stop the music, too
- Zooming with Chromium crashes the game :-/ OK with Iceweasel though
- Most of the time, reloading the page breaks all sounds with Chromium

IE9 Support
--------------------------------------------------------------------------------

Things I had to do for IE9 support:
- favicon.ico at root
- Doctype HTML declaration
- meta X-UA-Compatible to disable compatibility mode as free.fr is listed in
  Microsoft's official compatibility view list, c.f.:
  http://msdn.microsoft.com/en-us/library/gg622935(v=vs.85).aspx
- const not supported, using var instead
- Check window.console existence to prevent crash with F12 tools closed
