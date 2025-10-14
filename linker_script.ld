MEMORY
{
  FLASH (rx) : ORIGIN = 0x0, LENGTH = 512K
  RAM (rwx) : ORIGIN = 0x20000000, LENGTH = 64K
}
SECTIONS
{
  .text : { *(.text*) } > FLASH
  .data : { *(.data*) } > RAM AT > FLASH
  .bss : { *(.bss*) } > RAM
}
