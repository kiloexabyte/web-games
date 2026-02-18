package commands

import "fmt"

func (Ops) Hello() error {
	fmt.Println("Hello from op!")
	return nil
}
