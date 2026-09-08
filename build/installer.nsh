; Personalización del instalador NSIS de SSH Manager (ADAVAM)
; Documentación: https://www.electron.build/docs/nsis#custom-nsis-script

!macro customWelcomePage
  !define MUI_WELCOMEPAGE_TITLE "Bienvenido al instalador de ${PRODUCT_NAME}"
  !define MUI_WELCOMEPAGE_TEXT "Este asistente le guiará durante la instalación de ${PRODUCT_NAME}.$\r$\n$\r$\n${PRODUCT_NAME} es desarrollado por ADAVAM.$\r$\nDescubra más herramientas, soporte y novedades en www.adavam.com$\r$\n$\r$\nHaga clic en Siguiente para continuar."
  !insertmacro MUI_PAGE_WELCOME
!macroend

!macro customFinishPage
  !define MUI_FINISHPAGE_TITLE "Instalación completada"
  !define MUI_FINISHPAGE_TEXT "${PRODUCT_NAME} se ha instalado correctamente en su equipo.$\r$\n$\r$\nGracias por confiar en ADAVAM."
  !define MUI_FINISHPAGE_LINK "Visitar ADAVAM - www.adavam.com"
  !define MUI_FINISHPAGE_LINK_LOCATION "https://www.adavam.com"

  !ifndef HIDE_RUN_AFTER_FINISH
    Function StartApp
      ${if} ${isUpdated}
        StrCpy $1 "--updated"
      ${else}
        StrCpy $1 ""
      ${endif}
      ${StdUtils.ExecShellAsUser} $0 "$launchLink" "open" "$1"
    FunctionEnd

    !define MUI_FINISHPAGE_RUN
    !define MUI_FINISHPAGE_RUN_FUNCTION "StartApp"
  !endif

  !insertmacro MUI_PAGE_FINISH
!macroend
